from django.db import models

# Create your models here.

''' We can't save a Python object to database --> We need models for that  '''

class Job(models.Model):
    image = models.ImageField(upload_to='images/')
    summary = models.CharField(max_length=200)