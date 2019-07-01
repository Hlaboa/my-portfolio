from django.db import models
import random

from tinymce import HTMLField
from django.contrib.auth import get_user_model

# default to 1 day from now
def get_random_number():
  return random.randint(1,1001)

User = get_user_model()

class Author(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, default='Haritz Laboa')
    author = models.CharField(max_length=20)
    profile_picture = models.ImageField()

    def __str__(self):
        return self.author

class Tag(models.Model):
    title = models.CharField(max_length=20)
    slug = models.SlugField(max_length=50, default='bla')

    def __str__(self):
        return self.title

class About(models.Model):
    español = HTMLField()
    english = HTMLField()


class Language(models.Model):
    title = models.CharField(max_length=20)

    def __str__(self):
        return self.title

class Post(models.Model):
    title = models.CharField(max_length=200,default='')
    slug = models.SlugField(max_length=150, unique=True)
    overview = models.TextField(default='')
    content = HTMLField()
    tags = models.ManyToManyField(Tag)
    language = models.ManyToManyField(Language, default=1)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, default=1)
    post_image = models.ImageField(upload_to='images/', default='none')
    overview_image = models.ImageField(upload_to='images/')
    cover_author = models.CharField(max_length=200, default='')
    cover_author_link = models.CharField(max_length=200, default='')
    git_link = models.CharField(max_length=250, default='none')
    view_count = models.IntegerField(default=0)
    read_time = models.IntegerField(default=0)
    timestamp = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ('timestamp',)

    def save(self, *args, **kwargs):
        self.slug = self.slug or slugify(self.title)
        super().save(*args, **kwargs)