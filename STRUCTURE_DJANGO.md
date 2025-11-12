# Structure d'un Projet Django

## 📁 Structure Actuelle (Projet Initial)

```
DjangoProject/
├── manage.py                    # Point d'entrée principal
├── DjangoProject/               # Package du projet
│   ├── __init__.py              # Fait du dossier un package Python
│   ├── settings.py              # Configuration du projet
│   ├── urls.py                  # Routes URL principales
│   ├── wsgi.py                  # Configuration WSGI (déploiement)
│   └── asgi.py                  # Configuration ASGI (async)
└── templates/                   # Templates HTML (déjà configuré)
```

## 📝 Explication Détaillée

### 1. `manage.py`
- **Rôle** : Point d'entrée pour toutes les commandes Django
- **Exemples d'utilisation** :
  - `python manage.py runserver` : Démarrer le serveur de développement
  - `python manage.py migrate` : Appliquer les migrations de base de données
  - `python manage.py createsuperuser` : Créer un administrateur
  - `python manage.py startapp nom_app` : Créer une nouvelle application

### 2. `DjangoProject/settings.py`
- **Rôle** : Configuration centralisée du projet
- **Éléments importants** :
  - `INSTALLED_APPS` : Liste des applications Django installées
  - `DATABASES` : Configuration de la base de données (SQLite par défaut)
  - `TEMPLATES` : Configuration des templates (déjà configuré pour `templates/`)
  - `STATIC_URL` : URL pour les fichiers statiques (CSS, JS, images)
  - `SECRET_KEY` : Clé secrète pour la sécurité (à garder secrète !)
  - `DEBUG` : Mode debug (True en développement, False en production)

### 3. `DjangoProject/urls.py`
- **Rôle** : Définit les routes URL principales du projet
- **Fonctionnement** : Route les URLs vers les vues (views)
- **Actuellement** : Seule route `/admin/` pour l'interface d'administration

### 4. `DjangoProject/wsgi.py` et `asgi.py`
- **WSGI** : Interface standard pour déployer sur des serveurs web (Apache, Nginx)
- **ASGI** : Interface asynchrone pour WebSockets et applications modernes

### 5. `templates/`
- **Rôle** : Dossier pour vos fichiers HTML
- **Déjà configuré** dans `settings.py` ligne 57

## 🎯 Prochaines Étapes Recommandées

### Créer votre première application Django :
```bash
python manage.py startapp nom_de_votre_app
```

Cela créera une structure comme :
```
nom_de_votre_app/
├── __init__.py
├── admin.py          # Configuration de l'interface admin
├── apps.py           # Configuration de l'app
├── models.py         # Définition des modèles (base de données)
├── views.py          # Logique métier (vues)
├── urls.py           # Routes URL de l'app (à créer)
├── tests.py          # Tests unitaires
└── migrations/       # Migrations de base de données
```

### Ensuite, vous devrez :
1. Ajouter l'app dans `INSTALLED_APPS` dans `settings.py`
2. Créer des modèles dans `models.py`
3. Créer des vues dans `views.py`
4. Créer `urls.py` dans l'app et l'inclure dans le `urls.py` principal
5. Créer des templates HTML dans `templates/`

## ✅ Votre Structure est Correcte !

Votre projet a été correctement initialisé avec Django 5.2.7. La structure suit les conventions Django standards.

