from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from .models import Post, About

@csrf_exempt
def home(request):
    if request.LANGUAGE_CODE == "es":
        current_language = 'Español'
    else:
        current_language = 'English'

    if 'lang' in request.COOKIES:
        current_language = request.COOKIES['lang']

    posts = Post.objects.filter(language__title=current_language).order_by('-timestamp')

    tags = []
    tags_title = []
    for post in posts.all():
        for tag in post.tags.all():
            if tag.title not in tags_title:
                tags.append(tag)
                tags_title.append(tag.title)

    response = render(request, 'home.html', {'posts': posts, 'language': current_language, 'tags': tags})

    if 'cat' in request.COOKIES:
        response.delete_cookie('cat')
    response.set_cookie('lang', current_language)
    return response

##################

def category_manage(request, tag_id):
    if request.LANGUAGE_CODE == "es":
        current_language = 'Español'
    else:
        current_language = 'English'

    if 'lang' in request.COOKIES:
        current_language = request.COOKIES['lang']

    posts = Post.objects.filter(language__title=current_language).order_by('-timestamp')

    tags = []
    tags_title = []
    for post in posts.all():
        for tag in post.tags.all():
            if tag.title not in tags_title:
                tags.append(tag)
                tags_title.append(tag.title)

    print(tags)
    response = render(request, 'home.html', {'posts': posts, 'language': current_language, 'tags': tags, 'category': tag_id})
    return response

##################

def about(request):
    if request.LANGUAGE_CODE == "es":
        current_language = 'Español'
    else:
        current_language = 'English'

    if 'lang' in request.COOKIES:
        current_language = request.COOKIES['lang']

    about = About.objects.first()
    print(current_language)

    response = render(request, 'about.html', {'about': about, 'language': current_language})
    return response

##################

def post(request, post_id):
    detail_post = get_object_or_404(Post, pk=post_id)
    response = render(request, 'post.html', {'post': detail_post})

    if str(post_id) not in request.COOKIES:
        response.set_cookie(str(post_id), max_age=300)
        detail_post.view_count += 1
        Post.objects.filter(pk=post_id).update(view_count=detail_post.view_count)

    return response

##################

def español(request):
    current_language = 'Español'
    posts = Post.objects.filter(language__title=current_language).order_by('-timestamp')

    tags = []
    tags_title = []
    for post in posts.all():
        for tag in post.tags.all():
            if tag.title not in tags_title:
                tags.append(tag)
                tags_title.append(tag.title)

    response = render(request, 'home.html', {'posts': posts, 'language': current_language, 'tags': tags})

    if 'cat' in request.COOKIES:
        response.delete_cookie('cat')
    response.set_cookie('lang', current_language)
    return response

##################

def english(request):
    current_language = 'English'
    posts = Post.objects.filter(language__title=current_language).order_by('-timestamp')

    tags = []
    tags_title = []
    for post in posts.all():
        for tag in post.tags.all():
            if tag.title not in tags_title:
                tags.append(tag)
                tags_title.append(tag.title)

    response = render(request, 'home.html', {'posts': posts, 'language': current_language, 'tags': tags})

    if 'cat' in request.COOKIES:
        response.delete_cookie('cat')
    response.set_cookie('lang', current_language)
    return response