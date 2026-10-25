from django.db import migrations
from indexing.schema import FTS_CREATE


class Migration(migrations.Migration):
    dependencies = [('indexing', '0001_initial')]
    operations = [migrations.RunSQL(FTS_CREATE, 'DROP TABLE indexed_fts')]
