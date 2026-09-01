from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .throttles import LoginRateThrottle, OffreRateThrottle, MessageRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.conf import settings
from django.db import models
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from .models import User, Demande, Offre, Evaluation, Conversation, Message, Notification
from .serializers import (
    UserSerializer, RegisterSerializer,
    DemandeSerializer, OffreSerializer, EvaluationSerializer,
    ArtisanPublicSerializer, ArtisanDetailSerializer, ConversationSerializer, MessageSerializer,
    NotificationSerializer
)
from .pagination import StandardResultsSetPagination
from .models import User, Demande, Offre, Evaluation, Conversation, Message, Notification
from .geo import haversine_km
from django.utils import timezone
from .models import User, Demande, Offre, Evaluation, Conversation, Message, Notification, FavoriArtisan, FavoriDemande
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
# ================================
# AUTH
# ================================
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Compte créé avec succès !',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Connexion réussie !',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user, context={'request': request}).data
        })
    return Response({'error': 'Identifiants incorrects'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
    except Exception:
        pass
    return Response({'message': 'Déconnexion réussie !'})


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    """
    Demande de réinitialisation de mot de passe.
    Répond toujours avec le même message (que l'email existe ou non)
    pour ne pas révéler quels emails sont enregistrés.
    """
    email = request.data.get('email', '').strip()
    message_generique = {
        'message': "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé."
    }
    if not email:
        return Response({'error': "L'email est requis"}, status=status.HTTP_400_BAD_REQUEST)

    # .first() plutôt que .get() : l'email n'est pas unique en base (AbstractUser
    # ne l'impose pas), donc .get() planterait avec MultipleObjectsReturned s'il
    # existe déjà des comptes en doublon.
    user = User.objects.filter(email=email).exclude(email='').first()
    if not user:
        return Response(message_generique, status=status.HTTP_200_OK)

    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    lien = f"{settings.FRONTEND_URL}/reset-password/{uidb64}/{token}"

    send_mail(
        subject="Réinitialisation de votre mot de passe FixIt",
        message=(
            f"Bonjour {user.username},\n\n"
            f"Clique sur ce lien pour choisir un nouveau mot de passe :\n{lien}\n\n"
            f"Si tu n'es pas à l'origine de cette demande, ignore cet email.\n\n"
            f"— L'équipe FixIt"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=True,
    )
    return Response(message_generique, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    """Valide le lien (uidb64 + token) et applique le nouveau mot de passe"""
    uidb64 = request.data.get('uidb64', '')
    token = request.data.get('token', '')
    nouveau_mot_de_passe = request.data.get('nouveau_mot_de_passe', '')

    if not uidb64 or not token or not nouveau_mot_de_passe:
        return Response({'error': 'Champs manquants'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'error': 'Lien de réinitialisation invalide'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({'error': 'Ce lien est invalide ou a expiré'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(nouveau_mot_de_passe, user=user)
    except ValidationError as e:
        return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(nouveau_mot_de_passe)
    user.save()
    return Response({'message': 'Mot de passe réinitialisé avec succès !'})


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user, context={'request': request}).data)
    serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Changement du mot de passe de l'utilisateur connecté"""
    ancien = request.data.get('ancien_mot_de_passe')
    nouveau = request.data.get('nouveau_mot_de_passe')

    if not ancien or not nouveau:
        return Response(
            {'error': "L'ancien et le nouveau mot de passe sont requis"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not request.user.check_password(ancien):
        return Response({'error': 'Ancien mot de passe incorrect'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        validate_password(nouveau, user=request.user)
    except ValidationError as e:
        return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)

    request.user.set_password(nouveau)
    request.user.save()
    return Response({'message': 'Mot de passe mis à jour avec succès !'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """Suppression définitive du compte de l'utilisateur connecté"""
    mot_de_passe = request.data.get('mot_de_passe')
    if not mot_de_passe or not request.user.check_password(mot_de_passe):
        return Response({'error': 'Mot de passe incorrect'}, status=status.HTTP_400_BAD_REQUEST)

    request.user.delete()
    return Response({'message': 'Compte supprimé avec succès'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def artisans_list(request):
    """Liste publique des artisans, avec recherche (nom/adresse) et filtre par spécialité"""
    artisans = User.objects.filter(role='artisan')

    specialite = request.query_params.get('specialite')
    if specialite:
        artisans = artisans.filter(specialite=specialite)

    q = request.query_params.get('q')
    if q:
        artisans = artisans.filter(
            models.Q(username__icontains=q) | models.Q(adresse__icontains=q)
        )

    artisans = artisans.order_by('id')

    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(artisans, request)
    serializer = ArtisanPublicSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def artisan_detail(request, pk):
    """Profil public détaillé d'un artisan : bio, compétences, missions, avis."""
    try:
        artisan = User.objects.get(pk=pk, role='artisan')
    except User.DoesNotExist:
        return Response({'error': 'Artisan introuvable'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ArtisanDetailSerializer(artisan, context={'request': request})
    return Response(serializer.data)

# ================================
# DEMANDES
# ================================
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def demandes_list(request):
    if request.method == 'GET':
                # Filtres optionnels : ?type_service=plomberie,electricite&statut=ouverte
        #                      &q=<recherche texte>&budget_min=&budget_max=&tri=
        #                      &urgent=1&lat=&lng=&distance=nearby|city
        qs = Demande.objects.all()
        type_service = request.query_params.get('type_service')
        statut = request.query_params.get('statut')
        q = request.query_params.get('q')
        budget_min = request.query_params.get('budget_min')
        budget_max = request.query_params.get('budget_max')
        tri = request.query_params.get('tri', 'recent')
        urgent = request.query_params.get('urgent')
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        distance_mode = request.query_params.get('distance')  # 'nearby' (5km) ou 'city' (tout)

        if type_service:
            # Sélection multiple : ?type_service=plomberie,electricite
            services = [s.strip() for s in type_service.split(',') if s.strip()]
            if services:
                qs = qs.filter(type_service__in=services)
        if statut:
            qs = qs.filter(statut=statut)
        if urgent in ('1', 'true', 'True'):
            qs = qs.filter(urgent=True)
        if q:
            qs = qs.filter(
                models.Q(titre__icontains=q) |
                models.Q(description__icontains=q) |
                models.Q(localisation__icontains=q)
            )
        if budget_min:
            try:
                qs = qs.filter(budget__gte=float(budget_min))
            except (TypeError, ValueError):
                pass
        if budget_max:
            try:
                qs = qs.filter(budget__lte=float(budget_max))
            except (TypeError, ValueError):
                pass

        user_lat = user_lng = None
        if lat and lng:
            try:
                user_lat, user_lng = float(lat), float(lng)
            except (TypeError, ValueError):
                user_lat = user_lng = None

        if distance_mode == 'nearby' and user_lat is not None and user_lng is not None:
            RAYON_NEARBY_KM = 5
            ids_proches = [
                d.id for d in qs.exclude(latitude__isnull=True).exclude(longitude__isnull=True)
                if haversine_km(user_lat, user_lng, d.latitude, d.longitude) <= RAYON_NEARBY_KM
            ]
            qs = qs.filter(id__in=ids_proches)

        tri_map = {
            'recent': '-date_creation',
            'ancien': 'date_creation',
            'budget_desc': '-budget',
            'budget_asc': 'budget',
        }
        qs = qs.order_by(tri_map.get(tri, '-date_creation'))

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = DemandeSerializer(page, many=True, context={'user_lat': user_lat, 'user_lng': user_lng, 'request': request})        
        return paginator.get_paginated_response(serializer.data)

    # POST : nécessite d'être connecté ET d'être un client
    if not request.user.is_authenticated:
        return Response({'error': 'Authentification requise'}, status=status.HTTP_401_UNAUTHORIZED)
    if request.user.role != 'client':
        return Response({'error': 'Seul un client peut publier une demande'}, status=status.HTTP_403_FORBIDDEN)

    serializer = DemandeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(client=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def demande_detail(request, pk):
    try:
        demande = Demande.objects.get(pk=pk)
    except Demande.DoesNotExist:
        return Response({'error': 'Demande introuvable'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        return Response(DemandeSerializer(demande, context={'request': request}).data)

    # Seul le propriétaire peut modifier ou supprimer
    if demande.client != request.user:
        return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = DemandeSerializer(demande, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    demande.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_demandes(request):
    """Demandes du client connecté"""
    demandes = Demande.objects.filter(client=request.user).order_by('-date_creation')
    return Response(DemandeSerializer(demandes, many=True).data)


# ================================
# OFFRES
# ================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([OffreRateThrottle])
def offres_list(request):
    if request.method == 'GET':
        offres = Offre.objects.all().order_by('-date_creation')

        # Filtre optionnel : ?artisan=<id> pour ne récupérer que les offres
        # d'un artisan donné (ex : "Mes offres" côté DashboardArtisan)
        artisan_id = request.query_params.get('artisan')
        if artisan_id:
            offres = offres.filter(artisan_id=artisan_id)

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(offres, request)
        serializer = OffreSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    # Seul un artisan peut faire une offre
    if request.user.role != 'artisan':
        return Response({'error': 'Seul un artisan peut soumettre une offre'}, status=status.HTTP_403_FORBIDDEN)

    demande_id = request.data.get('demande')

    try:
        demande_cible = Demande.objects.get(pk=demande_id)
    except Demande.DoesNotExist:
        return Response({'error': 'Demande introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if demande_cible.statut != 'ouverte':
        return Response(
            {'error': 'Cette demande n\'accepte plus de nouvelles offres.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if Offre.objects.filter(demande_id=demande_id, artisan=request.user).exists():
        return Response(
            {'error': 'Vous avez déjà soumis une offre sur cette demande. Modifiez-la plutôt que d’en créer une nouvelle.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = OffreSerializer(data=request.data)
    if serializer.is_valid():
        offre = serializer.save(artisan=request.user)
        Notification.objects.create(
            destinataire=offre.demande.client,
            type='nouvelle_offre',
            message=f"{request.user.username} a proposé une offre pour « {offre.demande.titre} »",
            lien=f"demandes/{offre.demande.id}",
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def offres_par_demande(request, demande_id):
    """
    Offres d'une demande spécifique — visibilité restreinte :
    - le client propriétaire de la demande voit toutes les offres reçues
    - un artisan ne voit que sa PROPRE offre (jamais celles de ses concurrents)
    - toute autre personne ne voit rien
    Avant ce correctif, n'importe quel utilisateur connecté pouvait voir les
    prix et messages de tous les artisans sur n'importe quelle demande.
    """
    try:
        demande = Demande.objects.get(pk=demande_id)
    except Demande.DoesNotExist:
        return Response({'error': 'Demande introuvable'}, status=status.HTTP_404_NOT_FOUND)

    offres = Offre.objects.filter(demande_id=demande_id).order_by('-date_creation')

    if demande.client != request.user:
        offres = offres.filter(artisan=request.user)

    return Response(OffreSerializer(offres, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accepter_offre(request, offre_id):
    """Le client accepte une offre → demande passe en 'en_cours'"""
    try:
        offre = Offre.objects.get(pk=offre_id)
    except Offre.DoesNotExist:
        return Response({'error': 'Offre introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if offre.demande.client != request.user:
        return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    # Refuser toutes les autres offres
    Offre.objects.filter(demande=offre.demande).update(est_acceptee=False)
    offre.est_acceptee = True
    offre.save()
    offre.demande.statut = 'en_cours'
    offre.demande.date_debut = timezone.now()
    offre.demande.save()

    Notification.objects.create(
        destinataire=offre.artisan,
        type='offre_acceptee',
        message=f"Votre offre pour « {offre.demande.titre} » a été acceptée !",
        lien=f"demandes/{offre.demande.id}",
    )

    return Response({'message': 'Offre acceptée !', 'offre': OffreSerializer(offre).data})


# ================================
# EVALUATIONS
# ================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def evaluations_list(request):
    if request.method == 'GET':
        evaluations = Evaluation.objects.all().order_by('-date_creation')
        return Response(EvaluationSerializer(evaluations, many=True).data)

    if request.user.role != 'client':
        return Response({'error': 'Seul un client peut évaluer'}, status=status.HTTP_403_FORBIDDEN)
    serializer = EvaluationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(client=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def evaluations_artisan(request, artisan_id):
    """Évaluations reçues par un artisan"""
    evaluations = Evaluation.objects.filter(artisan_id=artisan_id).order_by('-date_creation')
    moyenne = sum(e.note for e in evaluations) / len(evaluations) if evaluations else 0
    return Response({
        'moyenne': round(moyenne, 1),
        'total': evaluations.count(),
        'evaluations': EvaluationSerializer(evaluations, many=True).data
    })
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def evaluer_artisan(request, offre_id):
    """Client évalue l'artisan dont l'offre a été acceptée"""
    try:
        offre = Offre.objects.get(pk=offre_id, est_acceptee=True)
    except Offre.DoesNotExist:
        return Response({'error': 'Offre introuvable ou non acceptée'}, status=status.HTTP_404_NOT_FOUND)

    if offre.demande.client != request.user:
        return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    if Evaluation.objects.filter(client=request.user, artisan=offre.artisan).exists():
        return Response({'error': 'Vous avez déjà évalué cet artisan'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = EvaluationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(client=request.user, artisan=offre.artisan)
        offre.demande.statut = 'terminee'
        offre.demande.date_fin = timezone.now()
        offre.demande.save()
        Notification.objects.create(
            destinataire=offre.artisan,
            type='nouvel_avis',
            message=f"{request.user.username} vous a laissé un avis pour « {offre.demande.titre} »",
            lien=f"profil",
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def repondre_avis(request, evaluation_id):
    """L'artisan concerné répond publiquement à un avis client."""
    try:
        evaluation = Evaluation.objects.get(pk=evaluation_id)
    except Evaluation.DoesNotExist:
        return Response({'error': 'Avis introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if evaluation.artisan != request.user:
        return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    reponse = request.data.get('reponse_artisan', '').strip()
    if not reponse:
        return Response({'error': 'La réponse ne peut pas être vide'}, status=status.HTTP_400_BAD_REQUEST)
    if len(reponse) > 1000:
        return Response({'error': 'La réponse est trop longue (1000 caractères max)'}, status=status.HTTP_400_BAD_REQUEST)

    evaluation.reponse_artisan = reponse
    evaluation.date_reponse = timezone.now()
    evaluation.save()

    Notification.objects.create(
        destinataire=evaluation.client,
        type='nouvel_avis',
        message=f"{request.user.username} a répondu à votre avis",
        lien='dashboard',
    )

    return Response(EvaluationSerializer(evaluation).data)

# ================================
# CONVERSATIONS & MESSAGES
# ================================
def _est_participant(conversation, user):
    """Vérifie que l'utilisateur fait partie de la conversation (client ou artisan concerné)"""
    return conversation.demande.client == user or conversation.artisan == user


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def conversations_list(request):
    if request.method == 'GET':
        # Mes conversations, en tant que client (via mes demandes) ou en tant qu'artisan
        conversations = Conversation.objects.filter(
            models.Q(demande__client=request.user) | models.Q(artisan=request.user)
        ).order_by('-date_creation')
        serializer = ConversationSerializer(conversations, many=True, context={'request': request})
        return Response(serializer.data)

    # POST : créer (ou récupérer) une conversation pour une demande donnée
    demande_id = request.data.get('demande')
    artisan_id = request.data.get('artisan')

    try:
        demande = Demande.objects.get(pk=demande_id)
    except Demande.DoesNotExist:
        return Response({'error': 'Demande introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if request.user.role == 'artisan':
        artisan = request.user
    else:
        # Seul le client propriétaire de la demande peut initier une conversation avec un artisan
        if demande.client != request.user:
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        try:
            artisan = User.objects.get(pk=artisan_id, role='artisan')
        except User.DoesNotExist:
            return Response({'error': 'Artisan introuvable'}, status=status.HTTP_404_NOT_FOUND)

    conversation, _ = Conversation.objects.get_or_create(demande=demande, artisan=artisan)
    serializer = ConversationSerializer(conversation, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([MessageRateThrottle])
def messages_list(request, conversation_id):
    try:
        conversation = Conversation.objects.get(pk=conversation_id)
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if not _est_participant(conversation, request.user):
        return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        # Marquer comme lus les messages envoyés par l'autre participant
        conversation.messages.exclude(expediteur=request.user).filter(lu=False).update(lu=True)
        messages = conversation.messages.all()
        return Response(MessageSerializer(messages, many=True).data)

    type_message = request.data.get('type', 'texte')

    if type_message == 'localisation':
        try:
            latitude = float(request.data.get('latitude'))
            longitude = float(request.data.get('longitude'))
        except (TypeError, ValueError):
            return Response({'error': 'Coordonnées invalides'}, status=status.HTTP_400_BAD_REQUEST)

        if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            return Response({'error': 'Coordonnées hors limites'}, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.create(
            conversation=conversation,
            expediteur=request.user,
            type='localisation',
            # Texte de repli pour les notifications / anciens clients qui ne
            # savent pas encore afficher une carte.
            contenu='📍 Position partagée',
            latitude=latitude,
            longitude=longitude,
        )
    else:
        contenu = request.data.get('contenu', '').strip()
        if not contenu:
            return Response({'error': 'Le message ne peut pas être vide'}, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.create(
            conversation=conversation,
            expediteur=request.user,
            type='texte',
            contenu=contenu
        )

    destinataire = conversation.demande.client if request.user == conversation.artisan else conversation.artisan
    Notification.objects.create(
        destinataire=destinataire,
        type='nouveau_message',
        message=f"Nouveau message de {request.user.username} sur « {conversation.demande.titre} »",
        lien=f"messages?conversation={conversation.id}",
    )

    return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)

# ================================
# NOTIFICATIONS
# ================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    """Les 20 dernières notifications de l'utilisateur connecté"""
    notifs = Notification.objects.filter(destinataire=request.user)[:20]
    return Response(NotificationSerializer(notifs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_non_lues(request):
    """Nombre de notifications non lues (pour le badge de la cloche)"""
    count = Notification.objects.filter(destinataire=request.user, lu=False).count()
    return Response({'count': count})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notification_marquer_lue(request, pk):
    try:
        notif = Notification.objects.get(pk=pk, destinataire=request.user)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification introuvable'}, status=status.HTTP_404_NOT_FOUND)
    notif.lu = True
    notif.save()
    return Response(NotificationSerializer(notif).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def notifications_tout_marquer_lu(request):
    Notification.objects.filter(destinataire=request.user, lu=False).update(lu=True)
    return Response({'message': 'Toutes les notifications ont été marquées comme lues'})


# ================================
# FAVORIS
# ================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favori_artisan(request, artisan_id):
    """Le client ajoute/retire un artisan de ses favoris (bascule)."""
    if request.user.role != 'client':
        return Response({'error': 'Seul un client peut avoir des artisans favoris'}, status=status.HTTP_403_FORBIDDEN)
    try:
        artisan = User.objects.get(pk=artisan_id, role='artisan')
    except User.DoesNotExist:
        return Response({'error': 'Artisan introuvable'}, status=status.HTTP_404_NOT_FOUND)

    favori, created = FavoriArtisan.objects.get_or_create(client=request.user, artisan=artisan)
    if not created:
        favori.delete()
        return Response({'est_favori': False})
    return Response({'est_favori': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_favoris_artisans(request):
    """Liste des artisans favoris du client connecté."""
    if request.user.role != 'client':
        return Response({'error': 'Seul un client peut avoir des artisans favoris'}, status=status.HTTP_403_FORBIDDEN)
    artisans = User.objects.filter(suivi_par__client=request.user).order_by('-suivi_par__date_creation')
    serializer = ArtisanPublicSerializer(artisans, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_favori_demande(request, demande_id):
    """L'artisan sauvegarde/retire une demande de ses favoris (bascule)."""
    if request.user.role != 'artisan':
        return Response({'error': 'Seul un artisan peut sauvegarder des demandes'}, status=status.HTTP_403_FORBIDDEN)
    try:
        demande = Demande.objects.get(pk=demande_id)
    except Demande.DoesNotExist:
        return Response({'error': 'Demande introuvable'}, status=status.HTTP_404_NOT_FOUND)

    favori, created = FavoriDemande.objects.get_or_create(artisan=request.user, demande=demande)
    if not created:
        favori.delete()
        return Response({'est_favori': False})
    return Response({'est_favori': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mes_favoris_demandes(request):
    """Liste des demandes sauvegardées par l'artisan connecté."""
    if request.user.role != 'artisan':
        return Response({'error': 'Seul un artisan peut sauvegarder des demandes'}, status=status.HTTP_403_FORBIDDEN)
    demandes = Demande.objects.filter(favorisee_par__artisan=request.user).order_by('-favorisee_par__date_creation')
    serializer = DemandeSerializer(demandes, many=True, context={'request': request})
    return Response(serializer.data)

# ================================
# VÉRIFICATION D'IDENTITÉ ARTISAN
# ================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def soumettre_verification(request):
    """L'artisan soumet un document (CIN, matricule fiscal...) pour vérification."""
    if request.user.role != 'artisan':
        return Response({'error': 'Seul un artisan peut soumettre une vérification'}, status=status.HTTP_403_FORBIDDEN)

    document = request.FILES.get('document_verification')
    if not document:
        return Response({'error': 'Aucun document fourni'}, status=status.HTTP_400_BAD_REQUEST)

    if request.user.statut_verification == 'verifie':
        return Response({'error': 'Votre profil est déjà vérifié'}, status=status.HTTP_400_BAD_REQUEST)

    request.user.document_verification = document
    request.user.statut_verification = 'en_attente'
    request.user.date_soumission_verification = timezone.now()
    request.user.motif_rejet = ''
    request.user.save()

    return Response({
        'statut_verification': request.user.statut_verification,
        'date_soumission_verification': request.user.date_soumission_verification,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def verifications_en_attente(request):
    """Liste des artisans en attente de validation (réservé au staff Django admin)."""
    artisans = User.objects.filter(role='artisan', statut_verification='en_attente').order_by('date_soumission_verification')
    data = [
        {
            'id': a.id,
            'username': a.username,
            'specialite': a.specialite,
            'date_soumission_verification': a.date_soumission_verification,
            'document_verification': request.build_absolute_uri(a.document_verification.url) if a.document_verification else None,
        }
        for a in artisans
    ]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approuver_verification(request, artisan_id):
    """Le staff approuve la vérification d'un artisan."""
    try:
        artisan = User.objects.get(pk=artisan_id, role='artisan')
    except User.DoesNotExist:
        return Response({'error': 'Artisan introuvable'}, status=status.HTTP_404_NOT_FOUND)

    artisan.statut_verification = 'verifie'
    artisan.date_traitement_verification = timezone.now()
    artisan.motif_rejet = ''
    artisan.save()

    Notification.objects.create(
        destinataire=artisan, type='verification',
        message="Votre identité a été vérifiée ! Le badge Vérifié est maintenant visible sur votre profil.",
        lien='profil',
    )
    return Response({'statut_verification': artisan.statut_verification})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def rejeter_verification(request, artisan_id):
    """Le staff rejette la vérification d'un artisan, avec un motif optionnel."""
    try:
        artisan = User.objects.get(pk=artisan_id, role='artisan')
    except User.DoesNotExist:
        return Response({'error': 'Artisan introuvable'}, status=status.HTTP_404_NOT_FOUND)

    motif = request.data.get('motif', '').strip()
    artisan.statut_verification = 'rejete'
    artisan.date_traitement_verification = timezone.now()
    artisan.motif_rejet = motif or "Document illisible ou non conforme."
    artisan.save()

    Notification.objects.create(
        destinataire=artisan, type='verification',
        message=f"Votre demande de vérification a été refusée : {artisan.motif_rejet}",
        lien='profil',
    )
    return Response({'statut_verification': artisan.statut_verification, 'motif_rejet': artisan.motif_rejet})