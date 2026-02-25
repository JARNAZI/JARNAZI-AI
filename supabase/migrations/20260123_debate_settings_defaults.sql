-- Seed debate settings defaults (safe)
insert into public.site_settings (key, value, label, type)
select 'debate_rounds', '2', 'Debate rounds', 'number'
where not exists (select 1 from public.site_settings where key='debate_rounds');

insert into public.site_settings (key, value, label, type)
select 'debate_cost_per_turn', '1', 'Token cost per turn', 'number'
where not exists (select 1 from public.site_settings where key='debate_cost_per_turn');

insert into public.site_settings (key, value, label, type)
select 'debate_media_overhead', '2', 'Media overhead tokens', 'number'
where not exists (select 1 from public.site_settings where key='debate_media_overhead');

insert into public.site_settings (key, value, label, type)
select 'debate_base_cost', '1', 'Debate base cost', 'number'
where not exists (select 1 from public.site_settings where key='debate_base_cost');
