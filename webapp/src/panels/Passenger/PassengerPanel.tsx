import { useState, useRef, useCallback, type ReactElement } from 'react';
import { Panel, PanelHeader, PanelHeaderBack } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { RideDTO } from '@local-blablacar/contracts';
import { BOOKING_STATUS } from '@local-blablacar/contracts';
import { searchRides } from '../../api/rides';
import { cancelBooking as cancelBookingApi } from '../../api/bookings';
import { ConfirmPopout } from '../../components/ConfirmPopout';
import { ErrorSnackbar } from '../../components/ErrorSnackbar';
import { NetworkError } from '../../components/NetworkError';
import { useMyBookings } from '../../hooks/useMyBookings';
import { PassengerBookings, SearchForm, SearchResults } from './components';

type View = 'search' | 'results';
const STORAGE_KEY = 'passenger_search_state';

export function PassengerPanel({ nav }: { nav: string }) {
  const routeNavigator = useRouteNavigator();
  const { bookings: myBookings, isLoading: isBookingsLoading, error: initialLoadError, refetch: refetchBookings } = useMyBookings();

  const savedState = (() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  })();

  const [view, setView] = useState<View>(savedState.view || 'search');
  const [fromId, setFromId] = useState<string>(savedState.fromId || '');
  const [toId, setToId] = useState<string>(savedState.toId || '');
  const [date, setDate] = useState<string>(savedState.date || '');
  const [rides, setRides] = useState<RideDTO[] | null>(savedState.rides || null);
  
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<ReactElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const showErrorSnackbar = (msg?: string) => {
    if (!snackbar) setSnackbar(<ErrorSnackbar text={msg} onClose={() => setSnackbar(null)} />);
  };

  const saveState = useCallback((newState: any) => {
    try {
      const current = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...newState }));
    } catch {}
  }, []);

  const handleSearch = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const results = await searchRides({
        fromId: fromId ? Number(fromId) : undefined,
        toId: toId ? Number(toId) : undefined,
        date: date || undefined,
      }, controller.signal);
      
      if (!controller.signal.aborted) {
        setRides(results);
        setView('results');
        saveState({ view: 'results', fromId, toId, date, rides: results });
      }
    } catch (err: any) {
      if (!controller.signal.aborted) showErrorSnackbar('Не удалось выполнить поиск');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const processCancelBooking = async (bookingId: number) => {
    try {
      await cancelBookingApi(bookingId);
      await refetchBookings();
    } catch (err: any) {
      showErrorSnackbar(err.response?.data?.message || 'Не удалось отменить');
    }
  };

  if (initialLoadError && view === 'search') {
    return (
      <Panel nav={nav}>
        <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.push('/')} />}>Пассажир</PanelHeader>
        <NetworkError action={refetchBookings} text={initialLoadError} />
      </Panel>
    );
  }

  return (
    <Panel nav={nav}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.push('/')} />}>Пассажир</PanelHeader>

      <PassengerBookings 
        bookings={myBookings} 
        isLoading={isBookingsLoading} 
        onRefresh={refetchBookings} 
        onCancelClick={(id) => routeNavigator.showPopout(
          <ConfirmPopout title="Отменить?" text="Вы уверены?" onConfirm={() => processCancelBooking(id)} />
        )} 
      />

      {view === 'search' && (
        <SearchForm 
          fromId={fromId} toId={toId} date={date} 
          onFromIdChange={(v) => { setFromId(v); saveState({ fromId: v }); }}
          onToIdChange={(v) => { setToId(v); saveState({ toId: v }); }}
          onDateChange={(v) => { setDate(v); saveState({ date: v }); }}
          onSearch={handleSearch} 
          loading={loading} 
        />
      )}

      {view === 'results' && rides && (
        <SearchResults 
          rides={rides} 
          isBooked={(id) => myBookings.some((b) => b.rideId === id && (b.status === BOOKING_STATUS.PENDING || b.status === BOOKING_STATUS.APPROVED))} 
          onNewSearch={() => { setView('search'); saveState({ view: 'search', rides: null }); }} 
        />
      )}

      {snackbar}
    </Panel>
  );
}
