from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password as validate_password_strength
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User, Demande, Offre, Evaluation, Conversation, Message, Notification
from .models import User, Demande, Offre, Evaluation, Conversation, Message, Notification
from .geo import haversine_km
from .models import User, Demande, Offre, Evaluation, Conversation, Message, Notification, FavoriArtisan, FavoriDemande, Signalement
# ================================
# SERIALIZER USER
# ================================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'role',
            'telephone',
            'adresse',
            'specialite',
            'photo',
            'bio',
            'competences',
            'statut_verification',
            'date_soumission_verification',
            'motif_rejet',
            'is_staff',
        ]
        extra_kwargs = {
            'statut_verification': {'read_only': True},
            'date_soumission_verification': {'read_only': True},
            'motif_rejet': {'read_only': True},
            'is_staff': {'read_only': True},
        }

    def validate(self, data):
        # La contrainte "il faut choisir une spécialité pour devenir artisan"
        # n'existait que côté frontend (modal de confirmation) — un appel direct
        # à l'API pouvait basculer un compte en 'artisan' sans spécialité.
        role = data.get('role', getattr(self.instance, 'role', None))
        specialite = data.get('specialite', getattr(self.instance, 'specialite', ''))
        if role == 'artisan' and not specialite:
            raise serializers.ValidationError(
                {'specialite': "Une spécialité est requise pour activer le mode artisan."}
            )
        return data


# ================================
# SERIALIZER PUBLIC ARTISAN (liste/recherche)
# ================================
class ArtisanPublicSerializer(serializers.ModelSerializer):
    note_moyenne = serializers.SerializerMethodField()
    nb_avis = serializers.SerializerMethodField()
    est_favori = serializers.SerializerMethodField()
    est_verifie = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'specialite', 'adresse', 'photo', 'note_moyenne', 'nb_avis', 'est_favori', 'est_verifie']

    def get_note_moyenne(self, obj):
        evals = obj.evaluations_recues.all()
        if not evals:
            return 0
        return round(sum(e.note for e in evals) / len(evals), 1)

    def get_nb_avis(self, obj):
        return obj.evaluations_recues.count()

    def get_est_verifie(self, obj):
        return obj.statut_verification == 'verifie'

    def get_est_favori(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not user or not user.is_authenticated or user.role != 'client':
            return False
        return FavoriArtisan.objects.filter(client=user, artisan=obj).exists()
# ================================
# SERIALIZER PROFIL ARTISAN (détail public + privé)
# ================================
class ArtisanDetailSerializer(ArtisanPublicSerializer):
    competences_liste = serializers.SerializerMethodField()
    missions_completees = serializers.SerializerMethodField()
    taux_reussite = serializers.SerializerMethodField()
    dernieres_missions = serializers.SerializerMethodField()
    avis = serializers.SerializerMethodField()

    class Meta(ArtisanPublicSerializer.Meta):
        fields = ArtisanPublicSerializer.Meta.fields + [
            'bio', 'competences', 'competences_liste', 'telephone',
            'missions_completees', 'taux_reussite', 'dernieres_missions', 'avis',
            'statut_verification', 'date_soumission_verification', 'motif_rejet',
        ]

    def get_competences_liste(self, obj):
        if not obj.competences:
            return []
        return [c.strip() for c in obj.competences.split(',') if c.strip()]

    def _offres_terminees(self, obj):
        return Offre.objects.filter(
            artisan=obj, est_acceptee=True, demande__statut='terminee'
        ).select_related('demande')

    def get_missions_completees(self, obj):
        return self._offres_terminees(obj).count()

    def get_taux_reussite(self, obj):
        # Part des offres acceptées parmi toutes les offres envoyées par l'artisan.
        total = Offre.objects.filter(artisan=obj).count()
        if not total:
            return 0
        acceptees = Offre.objects.filter(artisan=obj, est_acceptee=True).count()
        return round(acceptees / total * 100)

    def get_dernieres_missions(self, obj):
        offres = self._offres_terminees(obj).order_by('-demande__date_creation')[:3]
        return [
            {
                'id': o.demande.id,
                'titre': o.demande.titre,
                'localisation': o.demande.localisation,
                'date': o.demande.date_creation,
                'type_service': o.demande.type_service,
            }
            for o in offres
        ]

    def get_avis(self, obj):
        evals = obj.evaluations_recues.select_related('client').order_by('-date_creation')[:5]
        return [
            {
                'id': e.id,
                'client_nom': e.client.username,
                'note': e.note,
                'commentaire': e.commentaire,
                'date': e.date_creation,
                'reponse_artisan': e.reponse_artisan,
                'date_reponse': e.date_reponse,
            }
            for e in evals
        ]

# ================================
# SERIALIZER INSCRIPTION
# ================================
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'role',
            'telephone',
            'adresse',
            'specialite',
        ]

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Un compte existe déjà avec cet email.')
        return value

    def validate_password(self, value):
        # Applique les mêmes règles (AUTH_PASSWORD_VALIDATORS) que le changement
        # et la réinitialisation de mot de passe — absentes ici jusqu'à présent,
        # ce qui permettait de créer un compte avec un mot de passe trivial
        # en appelant l'API directement (le minLength côté frontend ne protège rien).
        try:
            validate_password_strength(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def create(self, validated_data):
        # Crée un utilisateur avec mot de passe crypté
        # .get(...) partout : tous ces champs sont optionnels côté serializer,
        # donc on ne doit jamais supposer qu'ils sont présents dans validated_data
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'client'),
            telephone=validated_data.get('telephone', ''),
            adresse=validated_data.get('adresse', ''),
            specialite=validated_data.get('specialite', ''),
        )
        return user


# ================================
# SERIALIZER DEMANDE
# ================================
class DemandeSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source='client.username', read_only=True)
    distance_km = serializers.SerializerMethodField()
    est_favori = serializers.SerializerMethodField()

    class Meta:
        model = Demande
        fields = [
            'id', 'titre', 'description', 'type_service',
            'localisation', 'budget', 'date_creation',
            'statut', 'client', 'client_nom',
            'urgent', 'latitude', 'longitude', 'distance_km',
            'date_debut', 'date_fin', 'est_favori',
        ]
        extra_kwargs = {
            'client': {'read_only': True}  
        }

    def get_distance_km(self, obj):
        user_lat = self.context.get('user_lat')
        user_lng = self.context.get('user_lng')
        if user_lat is None or user_lng is None or obj.latitude is None or obj.longitude is None:
            return None
        return round(haversine_km(user_lat, user_lng, obj.latitude, obj.longitude), 1)

    def get_est_favori(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if not user or not user.is_authenticated or user.role != 'artisan':
            return False
        return FavoriDemande.objects.filter(artisan=user, demande=obj).exists()

    def validate_budget(self, value):
        if value <= 0:
            raise serializers.ValidationError('Le budget doit être supérieur à 0.')
        return value

# ================================
# SERIALIZER OFFRE
# ================================
class OffreSerializer(serializers.ModelSerializer):
    artisan_nom = serializers.CharField(source='artisan.username', read_only=True)
    demande_titre = serializers.CharField(source='demande.titre', read_only=True)
    demande_statut = serializers.CharField(source='demande.statut', read_only=True)
    demande_type_service = serializers.CharField(source='demande.type_service', read_only=True)
    demande_date_creation = serializers.DateTimeField(source='demande.date_creation', read_only=True)
    demande_date_debut = serializers.DateTimeField(source='demande.date_debut', read_only=True)
    demande_date_fin = serializers.DateTimeField(source='demande.date_fin', read_only=True)

    class Meta:
        model = Offre
        fields = [
            'id', 'prix_propose', 'message', 'date_creation',
            'est_acceptee', 'artisan', 'artisan_nom', 'demande',
            'demande_titre', 'demande_statut', 'demande_type_service',
            'demande_date_creation', 'demande_date_debut', 'demande_date_fin',
        ]
        extra_kwargs = {
            'artisan': {'read_only': True}  # ← ajoute ça
        }

    def validate_prix_propose(self, value):
        if value <= 0:
            raise serializers.ValidationError('Le prix proposé doit être supérieur à 0.')
        return value

# ================================
# SERIALIZER EVALUATION
# ================================
class EvaluationSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(
        source='client.username',
        read_only=True
    )
    artisan_nom = serializers.CharField(
        source='artisan.username',
        read_only=True
    )

    class Meta:
        model = Evaluation
        fields = [
            'id', 'note', 'commentaire', 'date_creation', 'client', 'client_nom',
            'artisan', 'artisan_nom', 'reponse_artisan', 'date_reponse',
        ]
        extra_kwargs = {
            'client': {'read_only': True},
            'artisan': {'read_only': True},
        }


# ================================
# SERIALIZER MESSAGE
# ================================
class MessageSerializer(serializers.ModelSerializer):
    expediteur_nom = serializers.CharField(source='expediteur.username', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'expediteur', 'expediteur_nom',
            'type', 'contenu', 'latitude', 'longitude', 'date_creation', 'lu'
        ]
        extra_kwargs = {
            'conversation': {'read_only': True},
            'expediteur': {'read_only': True},
        }


# ================================
# SERIALIZER CONVERSATION
# ================================
class ConversationSerializer(serializers.ModelSerializer):
    artisan_nom = serializers.CharField(source='artisan.username', read_only=True)
    artisan_photo = serializers.ImageField(source='artisan.photo', read_only=True, allow_null=True)
    client_nom = serializers.CharField(source='demande.client.username', read_only=True)
    client_photo = serializers.ImageField(source='demande.client.photo', read_only=True, allow_null=True)
    demande_titre = serializers.CharField(source='demande.titre', read_only=True)
    demande_statut = serializers.CharField(source='demande.statut', read_only=True)
    demande_type_service = serializers.CharField(source='demande.type_service', read_only=True)
    dernier_message = serializers.SerializerMethodField()
    non_lus = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'demande', 'demande_titre', 'demande_statut', 'demande_type_service',
            'artisan', 'artisan_nom', 'artisan_photo', 'client_nom', 'client_photo',
            'date_creation', 'dernier_message', 'non_lus'
        ]

    def get_dernier_message(self, obj):
        dernier = obj.messages.last()
        if not dernier:
            return None
        return MessageSerializer(dernier).data

    def get_non_lus(self, obj):
        # Nombre de messages non lus, envoyés par l'AUTRE utilisateur
        user = self.context['request'].user
        return obj.messages.exclude(expediteur=user).filter(lu=False).count()

# ================================
# SERIALIZER NOTIFICATION
# ================================
class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'message', 'lien', 'lu', 'date_creation']
        
# ================================
# SERIALIZER SIGNALEMENT
# ================================
class SignalementSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.CharField(source='auteur.username', read_only=True)
    utilisateur_signale_nom = serializers.CharField(source='utilisateur_signale.username', read_only=True, default=None)
    demande_signalee_titre = serializers.CharField(source='demande_signalee.titre', read_only=True, default=None)

    class Meta:
        model = Signalement
        fields = [
            'id', 'auteur', 'auteur_nom', 'utilisateur_signale', 'utilisateur_signale_nom',
            'demande_signalee', 'demande_signalee_titre', 'motif', 'description',
            'statut', 'date_creation', 'date_traitement',
        ]
        extra_kwargs = {
            'auteur': {'read_only': True},
            'utilisateur_signale': {'read_only': True},
            'demande_signalee': {'read_only': True},
            'statut': {'read_only': True},
        }