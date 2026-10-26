from django.db import migrations


def populate(apps, schema_editor):
    Note = apps.get_model('indexing', 'IndexedNote')
    Name = apps.get_model('indexing', 'IndexedName')
    from indexing.names import note_names
    for note in Note.objects.iterator(chunk_size=100):
        Name.objects.bulk_create([Name(note=note, name=name, resolvable=resolvable) for name, resolvable in note_names(note.path, note.title, note.ids, note.aliases)])


class Migration(migrations.Migration):
    dependencies = [('indexing', '0003_indexedname')]
    operations = [migrations.RunPython(populate, migrations.RunPython.noop)]
