import { useState, type ReactElement } from 'react';
import { Panel, PanelHeader, PanelHeaderBack, Spinner } from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { RideDTO } from '@local-blablacar/contracts';
import { createRide, cancelRide as cancelRideApi } from '../../api/rides';
import { updateBookingStatus } from '../../api/bookings';
import { ConfirmPopout } from '../../components/ConfirmPopout';
import { ErrorSnackbar } from '../../components/ErrorSnackbar';
import { NetworkError } from '../../components/NetworkError';
import { useMyRides } from '../../hooks/useMyRides';
import { ActiveTripsList, CreateRideForm, DriverRideDetail } from './components';

export function DriverPanel({ nav }: { nav: string }) {
  const routeNavigator = useRouteNavigator();
  const { rides: myRides, isLoading, error: initialLoadError, refetch } = useMyRides();
  
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedRide, setSelectedRide] = useState<RideDTO | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<ReactElement | null>(null);

  const showErrorSnackbar = (msg?: string, retry?: () => void) => {
    if (!snackbar) setSnackbar(<ErrorSnackbar text={msg} onClose={() => setSnackbar(null)} action={retry} />);
  };

  const processCreate = async (formData: any) => {
    setLoading(true);
    try {
      await createRide(formData);
      setView('list');
      await refetch();
    } catch (err: any) {
      showErrorSnackbar(err.response?.data?.message || 'Не удалось создать поездку');
    } finally {
      setLoading(false);
    }
  };

  const processCancelRide = async (rideId: number) => {
    try {
      await cancelRideApi(rideId);
      setSelectedRide(null);
      setView('list');
      await refetch();
    } catch (err: any) {
      showErrorSnackbar(err.response?.data?.message || 'Не удалось отменить поездку');
    }
  };

  const handleDecision = async (bookingId: number, status: 'APPROVED' | 'REJECTED') => {
    setDecisionLoading(bookingId);
    try {
      await updateBookingStatus(bookingId, { status });
      await refetch();
      if (selectedRide) {
        const fresh = myRides.find((r) => r.id === selectedRide.id);
        if (fresh) setSelectedRide(fresh);
      }
    } catch (err: any) {
      showErrorSnackbar(err.response?.data?.message || 'Не удалось обработать заявку');
    } finally {
      setDecisionLoading(null);
    }
  };

  if (initialLoadError && view === 'list') {
    return (
      <Panel nav={nav}>
        <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.push('/')} />}>Водитель</PanelHeader>
        <NetworkError action={refetch} text={initialLoadError} />
      </Panel>
    );
  }

  return (
    <Panel nav={nav}>
      <PanelHeader before={<PanelHeaderBack onClick={() => view === 'list' ? routeNavigator.push('/') : setView('list')} />}>
        {view === 'detail' ? 'Детали поездки' : 'Водитель'}
      </PanelHeader>

      {isLoading && <Spinner size="large" style={{ margin: '40px 0' }} />}

      {!isLoading && view === 'list' && (
        <ActiveTripsList 
          rides={myRides} 
          onCreateClick={() => setView('create')} 
          onRideClick={(r) => { setSelectedRide(r); setView('detail'); }} 
          onRefresh={refetch}
        />
      )}

      {!isLoading && view === 'create' && (
        <CreateRideForm 
          onBack={() => setView('list')} 
          onSubmit={(data) => routeNavigator.showPopout(
            <ConfirmPopout title="Опубликовать?" text="Опубликовать поездку?" onConfirm={() => processCreate(data)} />
          )} 
          loading={loading} 
        />
      )}

      {!isLoading && view === 'detail' && selectedRide && (
        <DriverRideDetail 
          ride={selectedRide} 
          decisionLoading={decisionLoading}
          onDecision={handleDecision}
          onCancelRide={(id) => routeNavigator.showPopout(
            <ConfirmPopout title="Отменить?" text="Действие нельзя будет отменить." onConfirm={() => processCancelRide(id)} />
          )} 
        />
      )}
      
      {snackbar}
    </Panel>
  );
}
