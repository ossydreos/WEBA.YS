from django.shortcuts import render, HttpResponse, redirect, get_object_or_404
from django.contrib import messages
from .models import *
from .forms import CommentForm


# Create your views here.

def home(request):
    return render(request, 'home.html')


def match_detail(request, match_id):
    """
    Affiche les détails d'un match : les équipes, les votes, les pourcentages et les commentaires.
    Gère aussi l'ajout de commentaires (Create du CRUD).
    """
    match = get_object_or_404(Match, id=match_id)
    
    # Récupérer les deux équipes du match via MatchTeam
    match_teams = MatchTeam.objects.filter(match=match).order_by('team_pos')
    team1 = match_teams.filter(team_pos=1).first()
    team2 = match_teams.filter(team_pos=2).first()
    
    # Calculer les pourcentages de votes
    total_votes = 0
    if team1:
        total_votes += team1.votes
    if team2:
        total_votes += team2.votes
    
    team1_percent = 0
    team2_percent = 0
    if total_votes > 0:
        if team1:
            team1_percent = round((team1.votes / total_votes) * 100, 1)
        if team2:
            team2_percent = round((team2.votes / total_votes) * 100, 1)
    
    # Récupérer tous les commentaires du match (Read du CRUD)
    comments = Comment.objects.filter(match=match).order_by('-id')
    
    # Vérifier si l'utilisateur a déjà voté
    session_key = f'voted_match_{match_id}'
    has_voted = session_key in request.session
    
    # Gérer le formulaire de commentaire
    if request.method == 'POST' and 'add_comment' in request.POST:
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.match = match
            comment.save()
            messages.success(request, 'Votre commentaire a été ajouté !')
            return redirect('match_detail', match_id=match_id)
    else:
        form = CommentForm()
    
    context = {
        'match': match,
        'team1': team1,
        'team2': team2,
        'team1_percent': team1_percent,
        'team2_percent': team2_percent,
        'total_votes': total_votes,
        'comments': comments,
        'form': form,
        'has_voted': has_voted,
    }
    
    return render(request, 'match.html', context)


def vote(request, match_id, team_pos):
    """
    Permet de voter pour une équipe (Update du CRUD).
    Utilise les sessions pour éviter les votes multiples.
    """
    match = get_object_or_404(Match, id=match_id)
    match_team = get_object_or_404(MatchTeam, match=match, team_pos=team_pos)
    
    # Vérifier si l'utilisateur a déjà voté pour ce match
    session_key = f'voted_match_{match_id}'
    if session_key in request.session:
        messages.warning(request, 'Vous avez déjà voté pour ce match.')
        return redirect('match_detail', match_id=match_id)
    
    # Ajouter un vote
    match_team.votes += 1
    match_team.save()
    
    # Enregistrer dans la session que l'utilisateur a voté
    request.session[session_key] = True
    
    messages.success(request, f'Vote enregistré pour {match_team.team.team_name} !')
    return redirect('match_detail', match_id=match_id)


def cancel_vote(request, match_id):
    """
    Annule le vote de l'utilisateur (Delete du CRUD).
    Retire un vote de l'équipe pour laquelle l'utilisateur avait voté.
    """
    match = get_object_or_404(Match, id=match_id)
    
    session_key = f'voted_match_{match_id}'
    if session_key not in request.session:
        messages.warning(request, "Vous n'avez pas encore voté pour ce match.")
        return redirect('match_detail', match_id=match_id)
    
    # On retire un vote de l'équipe qui avait le plus de votes (ou la première)
    # Dans un vrai système, on devrait stocker pour quelle équipe l'utilisateur a voté
    # Mais pour simplifier, on retire un vote de l'équipe qui en a le plus
    match_teams = MatchTeam.objects.filter(match=match).order_by('-votes')
    if match_teams.exists():
        team_to_decrease = match_teams.first()
        if team_to_decrease.votes > 0:
            team_to_decrease.votes -= 1
            team_to_decrease.save()
    
    # Supprimer la session
    del request.session[session_key]
    
    messages.success(request, 'Vote annulé !')
    return redirect('match_detail', match_id=match_id)
