from django.contrib import admin
from django.conf import settings # we must import settings
from django.conf.urls.static import static  # it allows to add videos/images ...
from django.urls import path, include
import blog.views
from filebrowser.sites import site
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('admin/filebrowser/', site.urls),
    path('', blog.views.home, name='home'),
    path('about/', blog.views.about, name='about'),
    path('post/<slug:slug>/', blog.views.post, name='post'),
    path('tag/<slug:tag_slug>/', blog.views.category_manage, name='tag'),
    path('tinymce/', include('tinymce.urls')),
    path('en/',blog.views.english, name='english'),
    path('es/',blog.views.español, name='español'),
    path('robots.txt', TemplateView.as_view(template_name='robots.txt', content_type='text/plain'))
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)   # we add MEDIA URL and MEDIA ROOT


if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL , document_root = settings.STATIC_ROOT )
    urlpatterns += static(settings.MEDIA_URL , document_root = settings.MEDIA_ROOT )