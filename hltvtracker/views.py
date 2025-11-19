from django.shortcuts import render, HttpResponse, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Count
from .models import *
from .forms import CommentForm


def edit_comment(request, comment_id):

    comment = get_object_or_404(Comment, id=comment_id)

    if request.method == 'POST' and 'edit_comment' in request.POST:
        form = CommentForm(request.POST, instance=comment) 
        if form.is_valid():
            form.save()
            messages.success(request, 'Votre commentaire a été modifié !')
            return redirect('match_detail', match_id=comment.match.id)
    else:
        form = CommentForm(instance=comment)

    context = {
        'form': form,
        'comment': comment,
        'is_editing': True,
    }

    return render(request, 'edit_comment.html', context)


def delete_comment(request, comment_id):
   
    comment = get_object_or_404(Comment, id=comment_id)

    if request.method == 'POST':
        match_id = comment.match.id
        comment.delete()
        messages.success(request, 'Commentaire supprimé !')
        return redirect('match_detail', match_id=match_id)


    return redirect('match_detail', match_id=comment.match.id)




def home(request):
    return render(request, 'home.html')


def match_detail(request, match_id):

    match = get_object_or_404(Match, id=match_id)
    

    match_teams = MatchTeam.objects.filter(match=match).order_by('team_pos')
    team1 = match_teams.filter(team_pos=1).first()
    team2 = match_teams.filter(team_pos=2).first()

    # Calculer les pourcentages de votes
    team1_votes = team1.votes if team1 else 0
    team2_votes = team2.votes if team2 else 0
    total_votes = team1_votes + team2_votes

    team1_percent = 0
    team2_percent = 0
    if total_votes > 0:
        team1_percent = round((team1_votes / total_votes) * 100, 1)
        team2_percent = round((team2_votes / total_votes) * 100, 1)
    

    comments = Comment.objects.filter(match=match).order_by('-id')
    
    session_key = f'voted_match_{match_id}'
    has_voted = session_key in request.session
    
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
        'team1_votes': team1_votes,
        'team2_votes': team2_votes,
        'team1_percent': team1_percent,
        'team2_percent': team2_percent,
        'total_votes': total_votes,
        'comments': comments,
        'form': form,
        'has_voted': has_voted,
    }
    
    return render(request, 'match.html', context)


def vote(request, match_id, team_pos):


    match = get_object_or_404(Match, id=match_id)
    match_team = get_object_or_404(MatchTeam, match=match, team_pos=team_pos)


    session_key = f'voted_match_{match_id}'

    if session_key in request.session:
        messages.warning(request, 'Vous avez déjà voté pour ce match.')
        return redirect('match_detail', match_id=match_id)

    match_team.votes += 1
    match_team.save()

    request.session[session_key] = True

    messages.success(request, f'Vote enregistré pour {match_team.team.team_name} !')
    return redirect('match_detail', match_id=match_id)


def cancel_vote(request, match_id):

    match = get_object_or_404(Match, id=match_id)

    session_key = f'voted_match_{match_id}'
    if session_key not in request.session:
        messages.warning(request, "Vous n'avez pas encore voté pour ce match.")
        return redirect('match_detail', match_id=match_id)

    match_teams = MatchTeam.objects.filter(match=match).order_by('-votes')
    if match_teams.exists():
        team_to_decrease = match_teams.first()
        if team_to_decrease.votes > 0:
            team_to_decrease.votes -= 1
            team_to_decrease.save()

    del request.session[session_key]
    messages.success(request, 'Vote annulé !')

    return redirect('match_detail', match_id=match_id)
