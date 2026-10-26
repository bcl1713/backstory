import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [('wiki', '0002_recoverydraft'), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [migrations.CreateModel(name='MoveOperation', fields=[
        ('id', models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
        ('source', models.CharField(max_length=4096)),
        ('destination', models.CharField(max_length=4096)),
        ('state', models.CharField(max_length=32, default='preview')),
        ('plan', models.JSONField()),
        ('reason_code', models.CharField(max_length=64, default='')),
        ('index_state', models.CharField(max_length=16, default='not_started')),
        ('created_at', models.DateTimeField(auto_now_add=True)),
        ('actor', models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=django.db.models.deletion.PROTECT)),
    ])]
