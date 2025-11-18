from django.db import models

# Create your models here.

class TodoItem(models.Model):
    title = models.CharField(max_length=100)
    completed = models.BooleanField(default=False)
    def __str__(self):
        return self.title


# Modèles pour le système de votes de matchs

class Team(models.Model):
    """Représente une équipe"""
    team_name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.team_name


class Match(models.Model):
    """Représente un match entre deux équipes"""
    event_name = models.CharField(max_length=200)
    date_hour = models.DateTimeField()
    
    def __str__(self):
        return f"{self.event_name} - {self.date_hour}"


class MatchTeam(models.Model):
    """Lien entre un match et une équipe, avec position et votes"""
    match = models.ForeignKey(Match, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    team_pos = models.IntegerField(choices=[(1, 'Équipe 1'), (2, 'Équipe 2')])
    votes = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.match.event_name} - {self.team.team_name} (Position {self.team_pos})"


class Comment(models.Model):
    """Commentaire laissé sur un match"""
    match = models.ForeignKey(Match, on_delete=models.CASCADE)
    username = models.CharField(max_length=100)
    text = models.TextField()
    
    def __str__(self):
        return f"{self.username} sur {self.match.event_name}"