from pathlib import Path
import json
u=Path('nonproduction/approved-ride-ui');r=json.loads((u/'qa-screen2/results.json').read_text())
def geometry(v):return not v['horizontalOverflow'] and v['selectedIcons']==1 and v['visibleLabels']==['Ride'] and v['labelsInside'] and v['navInViewport'] and v['activeCircleUnclipped'] and v['activeCircleClearance']>=0 and all(c['touchTarget'] and c['imageContained'] and c['titleWithinBody'] and c['objectFit']=='contain' for c in v['cards'])
s={'responsive_pass':all(geometry(v) for v in r['viewports']),'viewports':len(r['viewports']),'large_text_pass':geometry(r['largeText']),'selection_journeys_pass':len(r['selectionJourneys'])==3 and all(v['selectedRestored'] and v['navHidden'] for v in r['selectionJourneys']),'no_premature_booking':not r['bookingPosts'],'page_errors':r['pageErrors'],'axe_violations':len(r['accessibility']),'small_parcel_reachable':r.get('smallParcelReachable'),'home_back_pass':r.get('backToHome') and r.get('homeReturn',{}).get('navHidden'),'reduced_motion_pass':r['reducedMotion']=='0s','protected_pages_require_auth':all(p['authenticationRequired'] for p in r['protectedRoutes']),'failure':r.get('failure')}
(u/'qa-screen2/summary.json').write_text(json.dumps(s,indent=2))
print(json.dumps(s,indent=2))
