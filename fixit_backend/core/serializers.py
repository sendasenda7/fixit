from rest_framework import serializers
from .models import User, Demande, Offre, Evaluation, Conversation, Message, Notification


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
            'photo'
        ]


# ================================
# SERIALIZER PUBLIC ARTISAN (liste/recherche)
# ================================
class ArtisanPublicSerializer(serializers.ModelSerializer):
    note_moyenne = serializers.SerializerMethodField()
    nb_avis = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'specialite', 'adresse', 'photo', 'note_moyenne', 'nb_avis']

    def get_note_moyenne(self, obj):
        evals = obj.evaluations_recues.all()
        if not evals:
            return 0
        return round(sum(e.note for e in evals) / len(evals), 1)

    def get_nb_avis(self, obj):
        return obj.evaluations_recues.count()


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

    class Meta:
        model = Demande
        fields = [
            'id', 'titre', 'description', 'type_service',
            'localisation', 'budget', 'date_creation',
            'statut', 'client', 'client_nom'
        ]
        extra_kwargs = {
            'client': {'read_only': True}  
        }

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

    class Meta:
        model = Offre
        fields = [
            'id', 'prix_propose', 'message', 'date_creation',
            'est_acceptee', 'artisan', 'artisan_nom', 'demande',
            'demande_titre', 'demande_statut', 'demande_type_service'
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
        fields = ['id', 'note', 'commentaire', 'date_creation', 'client', 'client_nom', 'artisan', 'artisan_nom']
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
            'contenu', 'date_creation', 'lu'
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