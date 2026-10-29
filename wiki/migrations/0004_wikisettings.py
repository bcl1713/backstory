from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('wiki', '0003_moveoperation')]
    operations = [migrations.CreateModel(name='WikiSettings', fields=[
        ('id', models.PositiveSmallIntegerField(default=1, editable=False, primary_key=True, serialize=False)),
        ('timezone', models.CharField(max_length=128)),
    ])]
