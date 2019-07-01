# Generated by Django 2.2.2 on 2019-07-01 14:34

import blog.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blog', '0008_post_read_time'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='slug',
            field=models.SlugField(default=blog.models.get_random_number, max_length=150),
        ),
    ]
