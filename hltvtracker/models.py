from django.db import models

# Create your models here.

class Team(models.Model):
    team_name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.team_name


class Match(models.Model):
    event_name = models.CharField(max_length=200)
    date_hour = models.DateTimeField()
    
    def __str__(self):
        return f"{self.event_name} - {self.date_hour}"


class MatchTeam(models.Model):
    match = models.ForeignKey(Match, on_delete=models.CASCADE)
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    team_pos = models.IntegerField(choices=[(1, 'Équipe 1'), (2, 'Équipe 2')])
    votes = models.IntegerField(default=0)

    class Meta:
        unique_together = ['match', 'team_pos']

    def __str__(self):
        return f"{self.match.event_name} - {self.team.team_name} (Position {self.team_pos})"


class Vote(models.Model):
  
    match_team = models.ForeignKey(MatchTeam, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40) 
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['match_team', 'session_key'] 

    def __str__(self):
        return f"Vote de {self.session_key} pour {self.match_team}"


class Comment(models.Model):
    SENTIMENT_CHOICES = [
        ('POSITIVE', 'Positif'),
        ('NEGATIVE', 'Négatif'),
        ('NEUTRAL', 'Neutre'),
    ]

    match = models.ForeignKey(Match, on_delete=models.CASCADE)
    username = models.CharField(max_length=100)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    sentiment = models.CharField(
        max_length=10,
        choices=SENTIMENT_CHOICES,
        blank=True,
        null=True,
        help_text="Analyse automatique du sentiment du commentaire"
    )

    def __str__(self):
        return f"{self.username} sur {self.match.event_name}"