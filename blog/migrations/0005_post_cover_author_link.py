# Generated by Django 2.2 on 2019-05-01 23:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0004_author_author'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='cover_author_link',
            field=models.CharField(default='', max_length=200),
        ),
    ]