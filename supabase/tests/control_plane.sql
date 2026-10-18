begin;
select plan(4);
select has_table('public', 'clients', 'clients exists');
select has_table('public', 'task_steps', 'task steps exists');
select col_is_unique('public', 'tasks', 'idempotency_key', 'logical tasks are unique');
select policies_are('public', 'clients', array['clients_tenant_isolation'], 'clients have tenant RLS');
select * from finish();
rollback;
