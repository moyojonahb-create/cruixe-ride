from pathlib import Path
import re,json
root=Path.cwd();out=root/'nonproduction/approved-ride-ui/qa-popup-retirement'
def read(p):
 raw=p.read_bytes();return raw,raw.decode('utf-8-sig').replace('\r\n','\n')
def save(p,raw,s):
 if b'\r\n' in raw:s=s.replace('\n','\r\n')
 p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
props='''                  <TripPaymentSelector
                    selected={paymentMethod} onSelect={setPaymentMethod}
                    walletBalance={walletBalance} estimatedFare={fareBreakdown?.totalFare ?? 0}
                    restrictToCash={bookForSomeoneElse && thirdPartyPayer === 'passenger'}
                    restrictReason="This passenger pays cash on arrival."
                  />'''
for prefix in ['','nonproduction/approved-ride-ui/']:
 p=root/prefix/'src/components/ride/RideView.tsx';raw,s=read(p)
 assert "import PaymentMethodSelector from './PaymentMethodSelector';" in s
 s=s.replace("import PaymentMethodSelector from './PaymentMethodSelector';","import TripPaymentSelector from './TripPaymentSelector';")
 s=s.replace('  const [paymentPopupOpen, setPaymentPopupOpen] = useState(false);\n','')
 a=s.index('      <PaymentMethodSelector\n');b=s.index('      <NoteToDriverSheet',a);s=s[:a]+s[b:]
 s=s.replace('  // Shared by the "Find drivers"/"Choose <tier>" CTA and the payment-method\n  // popup\'s confirm — payment selection now happens inline the first time\n  // the rider tries to book, instead of as its own card in the list above.','  // Only the explicit booking action submits; payment choices edit local state.')
 if prefix:
  a=s.index('                <button type="button" onClick={() => setPaymentPopupOpen(true)}');b=s.index('                </button>',a)+len('                </button>');s=s[:a]+props+s[b:]
 else:
  a=s.index('  // Payment method row is only shown');b=s.index('  const { balance: walletBalance }',a);s=s[:a]+s[b:]
  s=s.replace('  const [luggagePromptOpen, setLuggagePromptOpen] = useState(false);\n','').replace('  const [luggagePromptShown, setLuggagePromptShown] = useState(false);\n','')
  a=s.index('  // One-time luggage prompt');b=s.index("  // Check the browser's actual permission",a);s=s[:a]+s[b:]
  a=s.index('              {/* Luggage prompt');b=s.index("              {selectedTier !== 'parcel'",a);s=s[:a]+s[b:]
  s=s.replace('                    if (!paymentMethodConfirmed) { setPaymentPopupOpen(true); return; }\n','')
  a=s.index('              <div className="flex items-center gap-3">',s.index("'Who is riding?"))
  row='''              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 8, marginBottom: 10 }}>
                <button type="button" onClick={() => setLuggageOpen(true)} style={{ minHeight: 68, borderRadius: 22, padding: 12, background: '#fff', color: RIDE_TEXT, textAlign: 'left', ...glassSurface }}>
                  <strong style={{ display: 'block', fontSize: 14 }}>Luggage</strong>
                  <small>{luggageDraft ? 'Details added' : 'Optional details'}</small>
                </button>
'''+props+'''\n              </div>\n\n'''
  s=s[:a]+row+s[a:]
 assert 'paymentPopupOpen' not in s and 'setPaymentPopupOpen' not in s and 'luggagePrompt' not in s
 save(p,raw,s)
for prefix in ['','nonproduction/approved-ride-ui/']:
 p=root/prefix/'src/components/ride/NoteToDriverSheet.tsx';raw,s=read(p)
 s="import * as DialogPrimitive from '@radix-ui/react-dialog';\n"+s
 s=s.replace('    <>\n      <div className="fixed inset-0 z-[60]"', '    <DialogPrimitive.Root open={open} onOpenChange={next => { if (!next) handleClose(); }}>\n      <DialogPrimitive.Portal>\n      <DialogPrimitive.Overlay className="fixed inset-0 z-[60]"')
 s=s.replace('<div className="fixed left-0 right-0 bottom-0 z-[70]"','<DialogPrimitive.Content className="fixed left-0 right-0 bottom-0 z-[70] outline-none"')
 s=s.replace("width: '100%' }}>\n        <RideGlassPanel", "width: '100%' }}>\n        <RideGlassPanel")
 s=s.replace('<p style={{ fontSize: 17,','<DialogPrimitive.Title style={{ fontSize: 17,',1).replace('Note for your driver</p>','Note for your driver</DialogPrimitive.Title>')
 s=s.replace('<p style={{ marginTop: 3,','<DialogPrimitive.Description style={{ marginTop: 3,',1).replace('before they accept</p>','before they accept</DialogPrimitive.Description>')
 s=s.replace('width: 32, height: 32','width: 44, height: 44').replace('height: 34, padding:', 'minHeight: 44, padding:').replace('fontSize: 14.5, fontWeight: 500, lineHeight: 1.4','fontSize: 16, fontWeight: 500, lineHeight: 1.4')
 s=s.replace("maxHeight: '90vh'","maxHeight: '90dvh'")
 s=s.replace("onClick={() => handleChipToggle(label)}", "onClick={() => handleChipToggle(label)}\n                        aria-pressed={selected}")
 s=s.replace("onClick={() => setReuseDraft((v) => !v)}", "onClick={() => setReuseDraft((v) => !v)}\n                aria-pressed={reuseDraft}")
 s=s.replace('className="w-full outline-none bg-transparent resize-none"','className="w-full focus-visible:outline focus-visible:outline-2 bg-transparent resize-none"')
 s=s.replace('        </RideGlassPanel>\n      </div>\n    </>', '        </RideGlassPanel>\n      </DialogPrimitive.Content>\n      </DialogPrimitive.Portal>\n    </DialogPrimitive.Root>')
 assert '<DialogPrimitive.Content' in s and 'Note for your driver</DialogPrimitive.Title>' in s
 save(p,raw,s)
for prefix in ['','nonproduction/approved-ride-ui/']:
 p=root/prefix/'src/components/ride/RideGlassPanel.tsx';raw,s=read(p)
 if prefix:
  s=s.replace('top: approved ? 0 : -4, width: Math.max(64, handleWidth), height: approved ? 30 : 24','top: 0, width: Math.max(64, handleWidth), height: 44')
  s=s.replace('width: handleWidth, height: 5, background:', "position: 'absolute', top: approved ? 12.5 : 5.5, width: handleWidth, height: 5, background:")
 else:
  s=s.replace('top: -4, width: 64, height: 24','top: 0, width: Math.max(64, handleWidth), height: 44')
  s=s.replace('width: handleWidth, height: 5, background:', "position: 'absolute', top: 5.5, width: handleWidth, height: 5, background:")
 save(p,raw,s)
print('Updated both rider flows, inline payment controls, Note dialog/targets and shared ribbon hit boxes. SVG path bytes and backend code untouched.')
