from django.contrib import admin
from django.conf import settings # we must import settings
from django.conf.urls.static import static  # it allows to add videos/images ...
from django.urls import include, path
import jobs.views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', jobs.views.home, name='home'),
    path('blog/', include('blog.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)   # we add MEDIA URL and MEDIA ROOT