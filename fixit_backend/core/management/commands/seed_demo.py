"""
Commande de seed pour peupler la base avec un jeu de données de démo réaliste.

Usage :
    python3 manage.py seed_demo            # ajoute les données de démo
    python3 manage.py seed_demo --reset    # supprime d'abord les anciennes données de démo

Toutes les données créées ici sont identifiables par le préfixe "demo_" sur le
username, ce qui permet de les recréer/supprimer proprement sans toucher aux
comptes réels créés par les utilisateurs de l'application.

Mot de passe de tous les comptes de démo : Demo1234!
"""
import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from core.models import User, Demande, Offre, Evaluation, Conversation, Message, Notification

PASSWORD = "Demo1234!"

# Quelques villes tunisiennes avec coordonnées approximatives, pour que le
# filtre "à proximité" et la future carte aient de vraies données à afficher.
VILLES = [
    ("Tunis, Bab Bhar", 36.8065, 10.1815),
    ("Ariana, Ennasr", 36.8625, 10.1956),
    ("La Marsa", 36.8782, 10.3247),
    ("Ben Arous", 36.7469, 10.2316),
    ("Sousse, Khezama", 35.8288, 10.6407),
    ("Sfax, Centre-ville", 34.7406, 10.7603),
    ("Nabeul", 36.4561, 10.7376),
    ("Bizerte", 37.2744, 9.8739),
    ("Monastir", 35.7643, 10.8113),
    ("Hammamet", 36.4000, 10.6167),
]

ARTISANS = [
    dict(username="demo_karim_plombier", specialite="plomberie",
         bio="Plombier depuis 12 ans, spécialisé en dépannage rapide et rénovation de salles de bain. Interventions 7j/7 sur Tunis et Ariana.",
         competences="Fuites & canalisations, Chauffe-eau, Sanitaires, Débouchage"),
    dict(username="demo_sami_electricien", specialite="electricite",
         bio="Électricien certifié NF C 15-100. Installation, mise aux normes, domotique et bornes de recharge véhicule électrique.",
         competences="Mise aux normes, Domotique, Tableau électrique, Bornes IRVE"),
    dict(username="demo_nour_peintre", specialite="peinture",
         bio="Peintre en bâtiment, finitions soignées, spécialiste enduits décoratifs et peintures écologiques.",
         competences="Peinture intérieure, Enduits décoratifs, Ravalement de façade"),
    dict(username="demo_yassine_clim", specialite="climatisation",
         bio="Technicien froid & climatisation, installation et entretien de tous types de splits, 8 ans d'expérience.",
         competences="Installation split, Entretien annuel, Recharge gaz, Dépannage"),
    dict(username="demo_ahmed_menuisier", specialite="menuiserie",
         bio="Menuisier ébéniste, meubles sur mesure et agencement intérieur. Bois massif et matériaux composites.",
         competences="Meubles sur mesure, Dressing, Parquet, Portes & fenêtres bois"),
    dict(username="demo_mehdi_reparation", specialite="reparation",
         bio="Bricoleur polyvalent pour toutes vos petites réparations du quotidien : montage, fixation, dépannage express.",
         competences="Montage meubles, Fixations murales, Petit bricolage, Serrurerie"),
    dict(username="demo_wael_plombier", specialite="plomberie",
         bio="Plombier chauffagiste, installation de chaudières et systèmes de chauffage central.",
         competences="Chauffage central, Chaudières, Plomberie générale"),
    dict(username="demo_rania_electricienne", specialite="electricite",
         bio="Électricienne, spécialiste installations résidentielles neuves et rénovation d'ancien.",
         competences="Installation neuve, Rénovation électrique, Éclairage LED"),
]

CLIENTS = [
    "demo_client_hela", "demo_client_walid", "demo_client_amira",
    "demo_client_bilel", "demo_client_syrine", "demo_client_ons",
]

DEMANDES_TEMPLATES = [
    dict(titre="Fuite sous l'évier de la cuisine", type_service="plomberie",
         description="Fuite d'eau détectée sous l'évier ce matin, ça goutte en continu. Besoin d'une intervention rapide avant que ça n'endommage le meuble.",
         budget=150, urgent=True),
    dict(titre="Installation chauffe-eau électrique", type_service="plomberie",
         description="Remplacement d'un chauffe-eau de 100L en panne par un nouveau modèle déjà acheté.",
         budget=280, urgent=False),
    dict(titre="Mise aux normes tableau électrique", type_service="electricite",
         description="Appartement ancien, tableau électrique non conforme. Besoin d'un devis pour mise aux normes complète.",
         budget=650, urgent=False),
    dict(titre="Panne de courant partielle", type_service="electricite",
         description="Une partie de l'appartement n'a plus de courant depuis hier soir, le disjoncteur ne se réenclenche pas.",
         budget=120, urgent=True),
    dict(titre="Peinture salon 30m²", type_service="peinture",
         description="Rafraîchissement complet du salon, murs et plafond, couleur blanc cassé, peinture déjà achetée.",
         budget=400, urgent=False),
    dict(titre="Ravalement façade petite maison", type_service="peinture",
         description="Façade extérieure à refaire, quelques fissures à reboucher avant peinture.",
         budget=1200, urgent=False),
    dict(titre="Installation climatiseur split", type_service="climatisation",
         description="Installation d'un split 12000 BTU dans une chambre, unité déjà achetée, besoin de la pose complète.",
         budget=350, urgent=False),
    dict(titre="Climatiseur qui ne refroidit plus", type_service="climatisation",
         description="Le climatiseur du salon souffle de l'air chaud depuis 2 jours, sûrement besoin d'une recharge de gaz.",
         budget=180, urgent=True),
    dict(titre="Dressing sur mesure chambre parentale", type_service="menuiserie",
         description="Construction d'un dressing sur mesure toute hauteur, largeur 3m, avec portes coulissantes.",
         budget=1800, urgent=False),
    dict(titre="Réparation porte d'entrée bois", type_service="menuiserie",
         description="La porte d'entrée en bois ferme mal depuis l'humidité de l'hiver, besoin d'un rabotage/ajustement.",
         budget=90, urgent=False),
    dict(titre="Montage cuisine équipée IKEA", type_service="reparation",
         description="Montage complet d'une cuisine IKEA livrée en kit, environ 12 éléments.",
         budget=320, urgent=False),
    dict(titre="Fixation TV murale + meuble TV", type_service="reparation",
         description="Fixation d'une TV 55 pouces au mur avec support articulé fourni, plus montage d'un petit meuble TV.",
         budget=80, urgent=False),
    dict(titre="Rénovation complète salle de bain", type_service="plomberie",
         description="Rénovation complète : douche à l'italienne, WC suspendu, vasque. Budget matériaux non inclus.",
         budget=2200, urgent=False),
    dict(titre="Installation borne de recharge véhicule électrique", type_service="electricite",
         description="Installation d'une borne 7kW dans un garage individuel, tableau électrique à proximité.",
         budget=900, urgent=False),
]


class Command(BaseCommand):
    help = "Peuple la base avec un jeu de données de démo (artisans, clients, demandes, offres, avis, messages)."

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset', action='store_true',
            help="Supprime d'abord tous les comptes de démo existants (préfixe demo_) avant de recréer les données.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['reset']:
            supprimes, _ = User.objects.filter(username__startswith='demo_').delete()
            self.stdout.write(self.style.WARNING(f"🗑️  {supprimes} enregistrements liés aux comptes demo_* supprimés."))

        self.stdout.write("👷 Création des artisans…")
        artisans = []
        for data in ARTISANS:
            artisan, created = User.objects.get_or_create(
                username=data['username'],
                defaults=dict(
                    email=f"{data['username']}@fixit-demo.tn",
                    role='artisan',
                    specialite=data['specialite'],
                    bio=data['bio'],
                    competences=data['competences'],
                    telephone=f"2{random.randint(1000000, 9999999)}",
                    adresse=random.choice(VILLES)[0],
                ),
            )
            if created:
                artisan.set_password(PASSWORD)
                artisan.save()
            artisans.append(artisan)

        self.stdout.write("🧑 Création des clients…")
        clients = []
        for username in CLIENTS:
            client, created = User.objects.get_or_create(
                username=username,
                defaults=dict(
                    email=f"{username}@fixit-demo.tn",
                    role='client',
                    telephone=f"2{random.randint(1000000, 9999999)}",
                    adresse=random.choice(VILLES)[0],
                ),
            )
            if created:
                client.set_password(PASSWORD)
                client.save()
            clients.append(client)

        self.stdout.write("📋 Création des demandes…")
        demandes = []
        for i, tpl in enumerate(DEMANDES_TEMPLATES):
            ville_nom, ville_lat, ville_lng = random.choice(VILLES)
            # Petite dispersion aléatoire autour de la ville pour ne pas avoir
            # tous les points strictement au même endroit sur une carte.
            lat = ville_lat + random.uniform(-0.03, 0.03)
            lng = ville_lng + random.uniform(-0.03, 0.03)

            # Statuts variés : quelques ouvertes, quelques en_cours, quelques terminées
            if i % 5 == 0:
                statut = 'terminee'
            elif i % 3 == 0:
                statut = 'en_cours'
            else:
                statut = 'ouverte'

            demande, created = Demande.objects.get_or_create(
                titre=tpl['titre'],
                client=random.choice(clients),
                defaults=dict(
                    description=tpl['description'],
                    type_service=tpl['type_service'],
                    localisation=ville_nom,
                    budget=tpl['budget'],
                    statut=statut,
                    urgent=tpl['urgent'],
                    latitude=lat,
                    longitude=lng,
                ),
            )
            # Étale les dates de création sur les 60 derniers jours pour un
            # historique crédible (auto_now_add oblige à repasser par update()).
            if created:
                jours = random.randint(0, 60)
                Demande.objects.filter(pk=demande.pk).update(
                    date_creation=timezone.now() - timedelta(days=jours, hours=random.randint(0, 23))
                )
            demandes.append(demande)

        self.stdout.write("💼 Création des offres…")
        offres = []
        for demande in demandes:
            artisans_du_metier = [a for a in artisans if a.specialite == demande.type_service] or artisans
            nb_offres = random.randint(1, 3)
            for artisan in random.sample(artisans_du_metier, min(nb_offres, len(artisans_du_metier))):
                variation = random.uniform(0.85, 1.15)
                offre, created = Offre.objects.get_or_create(
                    artisan=artisan,
                    demande=demande,
                    defaults=dict(
                        prix_propose=round(float(demande.budget) * variation, 2),
                        message="Bonjour, je peux intervenir rapidement, disponible cette semaine. N'hésitez pas si vous avez des questions.",
                        est_acceptee=(demande.statut in ('en_cours', 'terminee')),
                    ),
                )
                if created:
                    offres.append(offre)

        self.stdout.write("⭐ Création des avis…")
        for demande in demandes:
            if demande.statut != 'terminee':
                continue
            offre_acceptee = demande.offres.filter(est_acceptee=True).first()
            if not offre_acceptee:
                continue
            Evaluation.objects.get_or_create(
                client=demande.client,
                artisan=offre_acceptee.artisan,
                defaults=dict(
                    note=random.choice([4, 4, 5, 5, 5, 3]),
                    commentaire=random.choice([
                        "Travail soigné et ponctuel, je recommande.",
                        "Très professionnel, intervention rapide et efficace.",
                        "Bon rapport qualité-prix, communication facile.",
                        "Un peu de retard mais le résultat est très propre.",
                    ]),
                ),
            )

        self.stdout.write("💬 Création de quelques conversations et messages…")
        for demande in demandes[:5]:
            offre = demande.offres.first()
            if not offre:
                continue
            conv, _ = Conversation.objects.get_or_create(demande=demande, artisan=offre.artisan)
            if not conv.messages.exists():
                Message.objects.create(
                    conversation=conv, expediteur=demande.client,
                    contenu="Bonjour, votre offre m'intéresse, êtes-vous disponible cette semaine ?",
                )
                Message.objects.create(
                    conversation=conv, expediteur=offre.artisan,
                    contenu="Bonjour ! Oui tout à fait, je peux passer dès demain matin si ça vous convient.",
                )

        self.stdout.write("🔔 Création de quelques notifications…")
        for artisan in artisans[:4]:
            Notification.objects.get_or_create(
                destinataire=artisan, type='nouvelle_offre',
                message="Une nouvelle demande correspond à votre spécialité.",
                defaults=dict(lien='demandes'),
            )

        self.stdout.write(self.style.SUCCESS(
            f"\n✅ Terminé : {len(artisans)} artisans, {len(clients)} clients, "
            f"{len(demandes)} demandes, {Offre.objects.filter(demande__in=demandes).count()} offres.\n"
            f"🔑 Mot de passe de tous les comptes de démo : {PASSWORD}"
        ))