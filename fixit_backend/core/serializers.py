from rest_framework import serializers
from .models import User, Demande, Offre, Evaluation


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
            'adresse'
        ]

    def create(self, validated_data):
        # Crée un utilisateur avec mot de passe crypté
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'client'),
            telephone=validated_data.get('telephone', ''),
            adresse=validated_data.get('adresse', '')
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

# ================================
# SERIALIZER OFFRE
# ================================
class OffreSerializer(serializers.ModelSerializer):
    artisan_nom = serializers.CharField(source='artisan.username', read_only=True)
    demande_titre = serializers.CharField(source='demande.titre', read_only=True)
    demande_statut = serializers.CharField(source='demande.statut', read_only=True)

    class Meta:
        model = Offre
        fields = [
            'id', 'prix_propose', 'message', 'date_creation',
            'est_acceptee', 'artisan', 'artisan_nom', 'demande',
            'demande_titre', 'demande_statut'
        ]
        extra_kwargs = {
            'artisan': {'read_only': True}  # ← ajoute ça
        }

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