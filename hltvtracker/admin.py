from django.contrib import admin
from django.contrib.auth.models import User

from .models import *

# Register your models here.

admin.site.register(TodoItem)
admin.site.register(Team)
admin.site.register(Match)
admin.site.register(MatchTeam)
admin.site.register(Comment)