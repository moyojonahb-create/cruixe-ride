from pathlib import Path
u=Path('nonproduction/approved-ride-ui')
p=u/'src/test/RiderNavigation.test.tsx';s=p.read_text(encoding='utf-8');s=s.replace("it('does not add navigation to the approved initial ride-home screen or location entry'", "it('preserves home and derives Ride for location entry'").replace("app('/ride?view=locations&tier=share'); expect(screen.queryByRole('navigation')).not.toBeInTheDocument();", "expect(activeRiderTab('/ride', '?view=locations&tier=share')).toBe('ride');")
s=s.replace("app(); const bar = screen.getByRole('navigation');", "app(); const bar = screen.getByRole('navigation');\n  const initialCurve = document.querySelector('.rider-navigation__background path')?.getAttribute('d');").replace("expect(screen.getByTestId('route')).toHaveTextContent(route);", "expect(screen.getByTestId('route')).toHaveTextContent(route);\n  expect(document.querySelector('.rider-navigation__background path')?.getAttribute('d')).not.toBe(initialCurve);")
p.write_text(s,encoding='utf-8')
p=u/'src/test/DestinationSearchScreen.test.tsx';s=p.read_text(encoding='utf-8');s+='''\n describe('destination status and connected actions', () => {
 it('exposes GPS, map and network errors with the real callbacks', () => {
 const callbacks = props(); const {rerender}=render(<DestinationSearchScreen {...callbacks} activeField="dropoff" />);
 fireEvent.click(screen.getByRole('button', {name: /Use current location/})); expect(callbacks.onUseMyLocation).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole('button', {name: /Choose on map/})); expect(callbacks.onChooseOnMap).toHaveBeenCalledOnce();
 rerender(<DestinationSearchScreen {...callbacks} activeField="dropoff" query="Gwanda" searchError="Search unavailable" />);
 expect(screen.getByRole('alert')).toHaveTextContent('Search unavailable');
 expect(screen.queryByText(/No results for/)).not.toBeInTheDocument();
 });
});
''';p.write_text(s,encoding='utf-8')
