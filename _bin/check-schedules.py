import rcr
import yaml

warnings = False
def warn(msg):
    global warnings
    warnings = True
    print(f"WARNING! {msg}")

def warn_sc(path, msg):
    warn(f"schedule {path}: {msg}")

def check_schedule(path, route_ids):
    with open(path, 'r') as f:
        sched = yaml.safe_load(f)

    for entry in sched:
        if 'plan' not in entry:
            warn_sc(path, "missing plan")
            continue
        
        for phase in entry['plan']:
          if 'route_id' in phase:
              if type(phase['route_id']) != str:
                  warn_sc(path, "route_id must be a string")
                  continue

              if phase['route_id'] not in route_ids:
                  warn_sc(path, f"unknown route_id '{phase['route_id']}'")

def main():
    routes = rcr.load_route_db()
    route_ids = set([route['id'] for route in routes])
    for path in rcr.schedule_paths():
        check_schedule(path, route_ids)

if __name__ == '__main__':
    main()
