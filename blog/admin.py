from django.contrib import admin
from .models import Post, Tag, Language, Author, About

admin.site.register(Tag)
admin.site.register(Post)
admin.site.register(Language)
admin.site.register(Author)
admin.site.register(About)