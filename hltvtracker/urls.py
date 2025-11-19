from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('match/<int:match_id>/', views.match_detail, name='match_detail'),
    path('match/<int:match_id>/vote/<int:team_pos>/', views.vote, name='vote'),
    path('match/<int:match_id>/cancel-vote/', views.cancel_vote, name='cancel_vote'),
]
