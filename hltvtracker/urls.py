from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('match/<int:match_id>/', views.match_detail, name='match_detail'),
    path('api/match/<int:match_id>/comments/', views.comments_api, name='comments_api'),
    path('match/<int:match_id>/vote/<int:team_pos>/', views.vote, name='vote'),
    path('match/<int:match_id>/cancel-vote/', views.cancel_vote, name='cancel_vote'),
    path('comment/<int:comment_id>/edit/', views.edit_comment, name='edit_comment'),
    path('comment/<int:comment_id>/delete/', views.delete_comment, name='delete_comment'),
]
