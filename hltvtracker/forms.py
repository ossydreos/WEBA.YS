from django import forms
from .models import Comment


class CommentForm(forms.ModelForm):
    """Formulaire pour ajouter un commentaire sur un match"""
    
    class Meta:
        model = Comment
        fields = ['username', 'text']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Votre nom'}),
            'text': forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': 'Votre commentaire...'}),
        }
    
    def clean_username(self):
        """Validation : le nom d'utilisateur ne doit pas être vide"""
        username = self.cleaned_data.get('username')
        if not username or username.strip() == '':
            raise forms.ValidationError("Le nom d'utilisateur est obligatoire.")
        return username.strip()
    
    def clean_text(self):
        """Validation : le texte du commentaire ne doit pas être vide"""
        text = self.cleaned_data.get('text')
        if not text or text.strip() == '':
            raise forms.ValidationError("Le commentaire ne peut pas être vide.")
        return text.strip()

