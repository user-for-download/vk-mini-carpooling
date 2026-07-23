import { useEffect, useState } from 'react';
import {
  Panel as PanelType,
  PanelHeader,
  PanelHeaderBack,
  Select,
  Button,
  Text,
  Title,
  Div,
  Card,
  FormItem,
  Input,
} from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { RideDTO } from '@local-blablacar/contracts';
import { createRide, listMyRides, cancelRide as cancelRideApi } from '../api/rides';
import { updateBookingStatus } from '../api/bookings';
import { RIDE_STATUS, BOOKING_STATUS } from '@local-blablacar/contracts';
import { TripCard } from '../components/TripCard';
import { useLocations } from '../hooks/useLocations';
import { formatRideDateTime } from '../utils/format';
import '../styles.css';

type View = 'list' | 'create' | 'rides';

export function DriverPanel(props: React.ComponentProps<typeof PanelType>) {
  const routeNavigator = useRouteNavigator();
  const [view, setView] = useState<View>('list');
  const locations = useLocations();
  const [myRides, setMyRides] = useState<RideDTO[]>([]);
  const [form, setForm] = useState({
    fromId: '',
    toId: '',
    departureTime: '',
    seats: '1',
    price: '0',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const rides = await listMyRides();
    setMyRides(rides);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, []);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      await createRide({
        fromId: Number(form.fromId),
        toId: Number(form.toId),
        departureTime: new Date(form.departureTime).toISOString(),
        seatsAvailable: Number(form.seats),
        price: Number(form.price),
      });
      setForm({ fromId: '', toId: '', departureTime: '', seats: '1', price: '0' });
      setView('list');
      await refresh();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось создать поездку';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(bookingId: number, status: 'APPROVED' | 'REJECTED') {
    try {
      await updateBookingStatus(bookingId, { status });
      await refresh();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось обработать заявку';
      setError(message);
    }
  }

  async function handleCancelRide(rideId: number) {
    try {
      await cancelRideApi(rideId);
      await refresh();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось отменить поездку';
      setError(message);
    }
  }

  const activeRides = myRides.filter((r) => r.status === RIDE_STATUS.ACTIVE);

  return (
    <PanelType {...props}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.push('/')} />}>
        Водитель
      </PanelHeader>

      {error && (
        <Div>
          <Card mode="shadow" style={{ background: 'var(--vkui-color-background-negative)', padding: 12 }}>
            <Text style={{ color: 'white' }}>{error}</Text>
            <Button
              size="s"
              mode="secondary"
              onClick={() => setError(null)}
              style={{ marginTop: 8 }}
            >
              Закрыть
            </Button>
          </Card>
        </Div>
      )}

      {/* List View */}
      {view === 'list' && (
        <Div>
          {activeRides.length === 0 ? (
            <Card mode="shadow" style={{ textAlign: 'center', padding: 40 }}>
              <Title level="3" style={{ marginBottom: 8 }}>
                Нет активных поездок
              </Title>
              <Text style={{ color: 'var(--vkui-color-text-secondary)', marginBottom: 24 }}>
                Создайте поездку и найдите попутчиков
              </Text>
              <Button
                size="l"
                mode="primary"
                appearance="positive"
                onClick={() => setView('create')}
              >
                Создать поездку
              </Button>
            </Card>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Title level="3">Активные поездки</Title>
                <Button
                  size="s"
                  mode="primary"
                  appearance="positive"
                  onClick={() => setView('create')}
                >
                  Создать
                </Button>
              </div>

              {activeRides.map((ride) => (
                <div key={ride.id} style={{ marginBottom: 12 }}>
                  <TripCard
                    ride={ride}
                    bookings={ride.bookings}
                    mode="driver"
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, padding: '0 16px' }}>
                    <Button
                      size="s"
                      mode="secondary"
                      onClick={() => handleCancelRide(ride.id)}
                      style={{ flex: 1 }}
                    >
                      Отменить поездку
                    </Button>
                  </div>
                  {ride.bookings?.filter((b) => b.status === BOOKING_STATUS.PENDING).map((booking) => (
                    <div
                      key={booking.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderTop: '1px solid var(--vkui-color-separator)',
                        marginTop: 8,
                      }}
                    >
                      <div>
                        <Text style={{ fontWeight: 500 }}>Заявка: {booking.passenger?.firstName}</Text>
                        <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
                          {booking.seatsBooked} мест
                        </Text>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          size="s"
                          mode="primary"
                          appearance="positive"
                          onClick={() => handleDecision(booking.id, BOOKING_STATUS.APPROVED)}
                        >
                          Да
                        </Button>
                        <Button
                          size="s"
                          mode="secondary"
                          onClick={() => handleDecision(booking.id, BOOKING_STATUS.REJECTED)}
                        >
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <Button
                size="l"
                stretched
                mode="secondary"
                onClick={() => setView('rides')}
                style={{ marginTop: 12 }}
              >
                Все мои поездки ({myRides.length})
              </Button>
            </>
          )}
        </Div>
      )}

      {/* Create View */}
      {view === 'create' && (
        <Div>
          <Card mode="shadow">
            <Div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level="3">Новая поездка</Title>
                <Button
                  size="s"
                  mode="secondary"
                  onClick={() => setView('list')}
                >
                  Назад
                </Button>
              </div>

              <FormItem top="Откуда">
                <Select
                  placeholder="Выберите точку"
                  value={form.fromId}
                  onChange={(e) => setForm((f) => ({ ...f, fromId: e.target.value }))}
                  options={locations.map((l) => ({ label: l.name, value: String(l.id) }))}
                />
              </FormItem>

              <FormItem top="Куда">
                <Select
                  placeholder="Выберите точку"
                  value={form.toId}
                  onChange={(e) => setForm((f) => ({ ...f, toId: e.target.value }))}
                  options={locations.map((l) => ({ label: l.name, value: String(l.id) }))}
                />
              </FormItem>

              <FormItem top="Дата и время">
                <Input
                  type="datetime-local"
                  value={form.departureTime}
                  onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
                />
              </FormItem>

              <FormItem top="Мест">
                <Input
                  type="number"
                  min={1}
                  max={8}
                  value={form.seats}
                  onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
                />
              </FormItem>

              <FormItem top="Цена, ₽">
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </FormItem>

              <Button
                size="l"
                stretched
                mode="primary"
                appearance="positive"
                onClick={handleCreate}
                disabled={loading}
              >
                {loading ? 'Создание...' : 'Опубликовать'}
              </Button>
            </Div>
          </Card>
        </Div>
      )}

      {/* All Rides View */}
      {view === 'rides' && (
        <Div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Title level="3">Все мои поездки</Title>
            <Button
              size="s"
              mode="secondary"
              onClick={() => setView('list')}
            >
              Назад
            </Button>
          </div>

          {myRides.length === 0 ? (
            <Card mode="shadow" style={{ textAlign: 'center', padding: 40 }}>
              <Title level="3" style={{ marginBottom: 8 }}>
                Нет поездок
              </Title>
              <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
                Создайте первую поездку
              </Text>
            </Card>
          ) : (
            myRides.map((ride) => (
              <Card key={ride.id} mode="shadow" style={{ marginBottom: 12 }}>
                <Div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Title level="3" style={{ color: 'var(--vkui-color-text-accent)' }}>
                          {ride.price} ₽
                        </Title>
                        <Text style={{
                          fontSize: 12,
                          color: ride.status === RIDE_STATUS.ACTIVE
                            ? 'var(--vkui-color-text-positive)'
                            : ride.status === RIDE_STATUS.CANCELLED
                            ? 'var(--vkui-color-text-negative)'
                            : 'var(--vkui-color-text-secondary)',
                        }}>
                          {ride.status === RIDE_STATUS.ACTIVE && 'Активна'}
                          {ride.status === RIDE_STATUS.COMPLETED && 'Завершена'}
                          {ride.status === RIDE_STATUS.CANCELLED && 'Отменена'}
                        </Text>
                      </div>
                      <Text style={{ marginBottom: 4 }}>
                        {ride.from?.name} → {ride.to?.name}
                      </Text>
                      <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
                        {formatRideDateTime(ride.departureTime)}
                        {' · '}{ride.seatsAvailable} мест · {ride.bookings?.length || 0} заявок
                      </Text>
                    </div>

                    {ride.status === RIDE_STATUS.ACTIVE && (
                      <Button
                        size="s"
                        mode="secondary"
                        onClick={() => handleCancelRide(ride.id)}
                      >
                        Отменить
                      </Button>
                    )}
                  </div>
                </Div>
              </Card>
            ))
          )}
        </Div>
      )}
    </PanelType>
  );
}
