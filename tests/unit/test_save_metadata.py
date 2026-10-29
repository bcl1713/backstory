from datetime import datetime, timezone

from wiki.save_metadata import prepare_save_metadata, wiki_date


def test_modified_only_changes_existing_scalar_and_preserves_comment():
    source = '---\ncreated: 2020-01-01\nmodified: "old" # keep\ntitle: Hi\n---\nBody\n'
    assert prepare_save_metadata(source, source, '2026-10-29') == source.replace('"old"', '"2026-10-29"')


def test_existing_note_without_modified_is_not_retrofitted():
    for source in ['# Existing\n', '---\ntitle: Existing\n---\nBody\n']:
        assert prepare_save_metadata(source, source, '2026-10-29') == source


def test_new_note_gets_dates_and_heading_identity():
    assert prepare_save_metadata('# My New Note\n', None, '2026-10-29') == '---\ncreated: 2026-10-29\nmodified: 2026-10-29\nid: "my-new-note"\n---\n# My New Note\n'


def test_new_metadata_preserves_explicit_values_and_derives_id():
    source = '---\ntitle: My New Note\ncreated: 2020-01-01\n---\nBody\n'
    result = prepare_save_metadata(source, None, '2026-10-29')
    assert 'created: 2020-01-01' in result
    assert 'modified: 2026-10-29' in result and 'id: "my-new-note"' in result
    assert prepare_save_metadata(result, result, '2026-10-29') == result


def test_title_change_preserves_stable_id_and_prior_aliases():
    old = '---\ntitle: Old title\nid: permanent\naliases: [Other]\n---\nBody\n'
    new = old.replace('title: Old title', 'title: New title')
    result = prepare_save_metadata(new, old, '2026-10-29')
    assert 'id: permanent' in result and 'aliases: [Other, "Old title"]' in result
    assert prepare_save_metadata(result, result, '2026-10-29') == result


def test_alias_deduplicates_singular_and_plural():
    old = '---\ntitle: Old title\nalias: Old title\naliases: [Other]\n---\n'
    new = old.replace('title: Old title', 'title: New title')
    assert prepare_save_metadata(new, old, '2026-10-29') == new


def test_existing_nonmetadata_body_is_untouched_on_title_looking_change():
    assert prepare_save_metadata('# New\n', '# Old\n', '2026-10-29') == '# New\n'


def test_chicago_calendar_date_not_utc():
    assert wiki_date(datetime(2026, 10, 30, 1, tzinfo=timezone.utc)) == '2026-10-29'
    assert wiki_date(datetime(2026, 12, 1, 5, tzinfo=timezone.utc)) == '2026-11-30'


def test_block_aliases_keep_comments_and_other_fields():
    old = '---\ntitle: Old\naliases:\n  - First # comment\nother: yes\n---\n'
    new = old.replace('title: Old', 'title: New')
    result = prepare_save_metadata(new, old, '2026-10-29')
    assert '  - First # comment\n  - "Old"\nother: yes' in result


def test_anchored_modified_never_mutates_shared_value():
    import pytest
    from wiki.metadata import MetadataError
    source = '---\ncreated: &date 2020-01-01\nmodified: *date\n---\n'
    with pytest.raises(MetadataError, match='metadata_automatic_field_reference'):
        prepare_save_metadata(source, source, '2026-10-29')


def test_flow_header_and_crlf_preserve_body():
    source = '---\r\n{title: Name, custom: yes}\r\n---\r\nBody\r\n'
    result = prepare_save_metadata(source, None, '2026-10-29')
    assert result.endswith('---\r\nBody\r\n')
    assert 'created: 2026-10-29' in result and 'custom: yes' in result


def test_new_note_custom_id_never_replaced():
    source = '---\ntitle: Name\nid: custom\n---\n'
    assert 'id: custom' in prepare_save_metadata(source, None, '2026-10-29')


def test_scalar_alias_with_comma_keeps_one_alias():
    from wiki.metadata import parse_front_matter
    old = '---\ntitle: Old\nalias: One, Two\n---\n'
    new = old.replace('title: Old', 'title: New')
    result = prepare_save_metadata(new, old, '2026-10-29')
    assert 'alias: ["One, Two", "Old"]' in result
    parse_front_matter(result)


def test_corrected_invalid_previous_header_can_be_saved():
    corrected = '---\ntitle: Fixed\nmodified: old\n---\n'
    result = prepare_save_metadata(corrected, '---\ntitle: [\n---\n', '2026-10-29')
    assert 'modified: 2026-10-29' in result


def test_existing_nonmapping_metadata_is_not_rewritten():
    source = '---\n- old\n- list\n---\nBody\n'
    assert prepare_save_metadata(source, source, '2026-10-29') == source


def test_empty_frontmatter_new_gets_dates():
    assert prepare_save_metadata('---\n---\nBody\n', None, '2026-10-29') == '---\ncreated: 2026-10-29\nmodified: 2026-10-29\n---\nBody\n'


def test_block_literal_alias_does_not_corrupt_following_field():
    from wiki.metadata import yaml_data
    old = '---\ntitle: Old\naliases:\n  - |\n    First\nother: yes\n---\n'
    result = prepare_save_metadata(old.replace('title: Old', 'title: New'), old, '2026-10-29')
    values = yaml_data(result.split('---')[1])
    assert values['other'] is True and values['aliases'] == ['First\n', 'Old']


def test_flow_alias_trailing_comma_remains_valid():
    from wiki.metadata import yaml_data
    old = '---\ntitle: Old\naliases: [First,]\n---\n'
    result = prepare_save_metadata(old.replace('title: Old', 'title: New'), old, '2026-10-29')
    assert yaml_data(result.split('---')[1])['aliases'] == ['First', 'Old']


def test_empty_modified_value_preserves_comment():
    source = '---\nmodified: # comment\nother: value\n---\n'
    assert 'modified: 2026-10-29 # comment' in prepare_save_metadata(source, source, '2026-10-29')


def test_new_flow_header_trailing_comma():
    from wiki.metadata import yaml_data
    source = '---\n{title: Name,}\n---\n'
    result = prepare_save_metadata(source, None, '2026-10-29')
    assert yaml_data(result.split('---')[1])['id'] == 'name'


def test_heading_title_creates_id_and_renames_alias_without_title_field():
    old = '---\ncreated: 2020-01-01\n---\n# Old Heading\n'
    result = prepare_save_metadata(old.replace('# Old Heading', '# New Heading'), old, '2026-10-29')
    assert 'aliases: ["Old Heading"]' in result
    created = prepare_save_metadata('# New Note\n', None, '2026-10-29')
    assert 'id: "new-note"' in created


import pytest

@pytest.mark.parametrize('custom', ['[a,]', '{a: b,}'])
def test_nested_flow_trailing_comma_does_not_replace_root_separator(custom):
    from wiki.metadata import yaml_data
    source = '---\n{title: Name, custom: ' + custom + '}\n---\n'
    result = prepare_save_metadata(source, None, '2026-10-29')
    assert yaml_data(result.split('---')[1])['id'] == 'name'


def test_alias_deduplication_matches_case_insensitive_resolver():
    source = '---\ntitle: Old Title\naliases: [old title]\n---\n'
    edited = source.replace('title: Old Title', 'title: New Title')
    assert prepare_save_metadata(edited, source, '2026-10-29') == edited


def test_new_template_empty_dates_and_id_are_filled():
    source = '---\ntitle: New Note\nid: ""\ncreated:\nmodified:\n---\n'
    result = prepare_save_metadata(source, None, '2026-10-29')
    assert 'id: "new-note"' in result
    assert 'created: 2026-10-29' in result and 'modified: 2026-10-29' in result


def test_generated_id_is_string_even_for_yaml_keyword_or_number():
    from wiki.metadata import yaml_data
    for title in ['true', '123']:
        source = f'---\ntitle: "{title}"\nid:\n---\n'
        result = prepare_save_metadata(source, None, '2026-10-29')
        assert yaml_data(result.split('---')[1])['id'] == title
