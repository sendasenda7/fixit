from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator


def valider_taille_photo(fichier):
    """Empêche l'upload d'une photo de profil de plus de 5 Mo."""
    limite_mo = 5
    if fichier.size > limite_mo * 1024 * 1024:
        raise ValidationError(f"La photo dépasse {limite_mo} Mo. Choisissez un fichier plus léger.")

# ================================
# MODÈLE USER (Client ou Artisan)
# ================================
class User(AbstractUser):
    ROLE_CHOICES = [
        ('client', 'Client'),
        ('artisan', 'Artisan'),
    ]
    SPECIALITE_CHOICES = [
        ('plomberie', 'Plomberie'),
        ('electricite', 'Électricité'),
        ('reparation', 'Réparation'),
        ('peinture', 'Peinture'),
        ('climatisation', 'Climatisation'),
        ('menuiserie', 'Menuiserie'),
        ('autre', 'Autre'),
    ]
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='client'
    )
    telephone = models.CharField(max_length=20, blank=True)
    adresse = models.CharField(max_length=255, blank=True)
    specialite = models.CharField(
        max_length=50,
        choices=SPECIALITE_CHOICES,
        blank=True,
        help_text="Métier de l'artisan (non utilisé pour les clients)"
    )
    photo = models.ImageField(
        upload_to='photos/',
        blank=True,
        null=True,
        validators=[
            valider_taille_photo,
            FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp']),
        ],
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


# ================================
# MODÈLE DEMANDE
# ================================
class Demande(models.Model):
    TYPE_SERVICE_CHOICES = [
        ('plomberie', 'Plomberie'),
        ('electricite', 'Électricité'),
        ('reparation', 'Réparation'),
        ('peinture', 'Peinture'),
        ('climatisation', 'Climatisation'),
        ('menuiserie', 'Menuiserie'),
        ('autre', 'Autre'),
    ]
    STATUT_CHOICES = [
        ('ouverte', 'Ouverte'),
        ('en_cours', 'En cours'),
        ('terminee', 'Terminée'),
    ]

    titre = models.CharField(max_length=200)
    description = models.TextField()
    type_service = models.CharField(
        max_length=50,
        choices=TYPE_SERVICE_CHOICES
    )
    localisation = models.CharField(max_length=255)
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    date_creation = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='ouverte'
    )
    # Relation : une demande appartient à un client
    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='demandes'
    )

    def __str__(self):
        return f"{self.titre} - {self.client.username}"


# ================================
# MODÈLE OFFRE
# ================================
class Offre(models.Model):
    prix_propose = models.DecimalField(max_digits=10, decimal_places=2)
    message = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)
    est_acceptee = models.BooleanField(default=False)

    # Relation : une offre appartient à un artisan
    artisan = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='offres'
    )
    # Relation : une offre correspond à une demande
    demande = models.ForeignKey(
        Demande,
        on_delete=models.CASCADE,
        related_name='offres'
    )

    def __str__(self):
        return f"Offre de {self.artisan.username} pour {self.demande.titre}"


# ================================
# MODÈLE EVALUATION
# ================================
class Evaluation(models.Model):
    NOTE_CHOICES = [
        (1, '1 étoile'),
        (2, '2 étoiles'),
        (3, '3 étoiles'),
        (4, '4 étoiles'),
        (5, '5 étoiles'),
    ]

    note = models.IntegerField(choices=NOTE_CHOICES)
    commentaire = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)

    # Relation : évaluation faite par un client
    client = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='evaluations_donnees'
    )
    # Relation : évaluation reçue par un artisan
    artisan = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='evaluations_recues'
    )

    def __str__(self):
        return f"Évaluation {self.note}⭐ par {self.client.username}"


# ================================
# MODÈLE CONVERSATION
# ================================
class Conversation(models.Model):
    # Une conversation concerne une demande précise, entre le client de
    # cette demande et un artisan (celui qui a fait ou fera une offre).
    demande = models.ForeignKey(
        Demande,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    artisan = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('demande', 'artisan')

    def __str__(self):
        return f"Conversation #{self.id} - {self.demande.titre} ↔ {self.artisan.username}"


# ================================
# MODÈLE MESSAGE
# ================================
class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    expediteur = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='messages_envoyes'
    )
    contenu = models.TextField()
    date_creation = models.DateTimeField(auto_now_add=True)
    lu = models.BooleanField(default=False)

    class Meta:
        ordering = ['date_creation']

    def __str__(self):
        return f"Message de {self.expediteur.username} ({self.date_creation:%d/%m %H:%M})"

# ================================
# MODÈLE NOTIFICATION
# ================================
class Notification(models.Model):
    TYPE_CHOICES = [
        ('nouvelle_offre', 'Nouvelle offre'),
        ('offre_acceptee', 'Offre acceptée'),
        ('nouveau_message', 'Nouveau message'),
        ('nouvel_avis', 'Nouvel avis'),
    ]

    destinataire = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message = models.CharField(max_length=255)
    # Lien optionnel : ex. 'demandes/12' ou 'messages?conv=3', interprété côté frontend
    lien = models.CharField(max_length=255, blank=True)
    lu = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']

    def __str__(self):
        return f"{self.get_type_display()} pour {self.destinataire.username}"