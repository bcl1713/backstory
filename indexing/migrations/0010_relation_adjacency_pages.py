from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('indexing', '0009_incremental_relations')]
    operations = [
        migrations.AddIndex(
            model_name='resolvedrelation',
            index=models.Index(fields=['generation', 'epoch', 'source', 'occurrence'],
                               name='relation_source_page')),
        migrations.AddIndex(
            model_name='resolvedrelation',
            index=models.Index(fields=['generation', 'epoch', 'destination', 'occurrence'],
                               name='relation_target_page')),
    ]
