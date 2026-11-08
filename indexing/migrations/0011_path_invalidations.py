import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('indexing', '0010_relation_adjacency_pages')]
    operations = [
        migrations.AddField('indexjob', 'version', models.UUIDField(default=uuid.uuid4)),
        migrations.AddField('indexjob', 'invalidated', models.BooleanField(default=False)),
        migrations.AddField('indexjob', 'first_seen', models.FloatField(default=0)),
        migrations.AddField('indexjob', 'not_before', models.FloatField(default=0)),
        migrations.AddField('indexjob', 'missing_since', models.FloatField(null=True, default=None)),
        migrations.AddField('scanstate', 'last_verified', models.FloatField(default=0)),
        migrations.AddField('scanstate', 'watcher', models.JSONField(default=dict)),
    ]
