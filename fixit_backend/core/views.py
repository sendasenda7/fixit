from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, Demande, Offre, Evaluation
from .serializers import (
    UserSerializer, RegisterSerializer,
    DemandeSerializer, OffreSerializer, EvaluationSerializer
)


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
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
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
            'user': UserSerializer(user).data
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


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == 'GET':
        
        return Response(UserSerializer(request.user).data)
    serializer = UserSerializer(request.user, data=request.data, partial=True)
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


# ================================
# DEMANDES
# ================================
@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def demandes_list(request):
    if request.method == 'GET':
        # Filtres optionnels : ?type_service=plomberie&statut=ouverte
        qs = Demande.objects.all().order_by('-date_creation')
        type_service = request.query_params.get('type_service')
        statut = request.query_params.get('statut')
        if type_service:
            qs = qs.filter(type_service=type_service)
        if statut:
            qs = qs.filter(statut=statut)
        return Response(DemandeSerializer(qs, many=True).data)

    # POST : nécessite d'être connecté
    if not request.user.is_authenticated:
        return Response({'error': 'Authentification requise'}, status=status.HTTP_401_UNAUTHORIZED)

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
        return Response(DemandeSerializer(demande).data)

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
def offres_list(request):
    if request.method == 'GET':
        offres = Offre.objects.all().order_by('-date_creation')
        return Response(OffreSerializer(offres, many=True).data)

    # Seul un artisan peut faire une offre
    if request.user.role != 'artisan':
        return Response({'error': 'Seul un artisan peut soumettre une offre'}, status=status.HTTP_403_FORBIDDEN)

    serializer = OffreSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(artisan=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def offres_par_demande(request, demande_id):
    """Toutes les offres d'une demande spécifique"""
    offres = Offre.objects.filter(demande_id=demande_id).order_by('-date_creation')
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
    offre.demande.save()

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
        offre.demande.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)