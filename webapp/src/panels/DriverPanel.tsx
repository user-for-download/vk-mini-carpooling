import { useEffect, useState, useRef } from 'react';
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
  Textarea,
  Spinner,
} from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { RideDTO } from '@local-blablacar/contracts';
import { createRide, listMyRides, cancelRide as cancelRideApi } from '../api/rides';
import { updateBookingStatus } from '../api/bookings';
import { RIDE_STATUS, BOOKING_STATUS } from '@local-blablacar/contracts';
import { TripCard } from '../components/TripCard';
import { TripListItem } from '../components/TripListItem';
import { CarSeatMap } from '../components/CarSeatMap';
import { useLocations } from '../hooks/useLocations';
import { formatRideDateTime, formatPrice } from '../utils/format';
import { SEATS } from '../utils/constants';
import '../styles.css';

type View = 'list' | 'create' | 'detail';

export function DriverPanel(props: React.ComponentProps<typeof PanelType>) {
  const routeNavigator = useRouteNavigator();
  const [view, setView] = useState<View>('list');
  const { locations, loading: locationsLoading, error: locationsError } = useLocations();
  const [myRides, setMyRides] = useState<RideDTO[]>([]);
  const [selectedRide, setSelectedRide] = useState<RideDTO | null>(null);
  const [form, setForm] = useState({
    fromId: '',
    toId: '',
    departureTime: '',
    offeredSeats: [2, 3, 4, 5],
    price: 0,
    driverNote: '',
  });
  const [loading, setLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ignoreRef = useRef(false);

  async function refresh() {
    const rides = await listMyRides();
    if (!ignoreRef.current) setMyRides(rides);
  }

  useEffect(() => {
    ignoreRef.current = false;
    refresh().catch((err) => {
      if (!ignoreRef.current) {
        console.error(err);
        setError('Не удалось загрузить поездки');
      }
    });
    return () => { ignoreRef.current = true; };
  }, []);

  async function handleCreate() {
    if (!window.confirm('Опубликовать поездку?')) return;
    setLoading(true);
    setError(null);
    try {
      await createRide({
        fromId: Number(form.fromId),
        toId: Number(form.toId),
        departureTime: new Date(form.departureTime).toISOString(),
        offeredSeats: form.offeredSeats,
        price: form.price,
        driverNote: form.driverNote || undefined,
      });
      setForm({ fromId: '', toId: '', departureTime: '', offeredSeats: [2, 3, 4, 5], price: 0, driverNote: '' });
      setView('list');
      await refresh();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось создать поездку';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(bookingId: number, status: typeof BOOKING_STATUS.APPROVED | typeof BOOKING_STATUS.REJECTED) {
    setDecisionLoading(bookingId);
    setError(null);
    try {
      await updateBookingStatus(bookingId, { status });
      await refresh();
      // Update selected ride with fresh data
      if (selectedRide) {
        const updated = await listMyRides();
        const fresh = updated.find((r) => r.id === selectedRide.id);
        if (fresh) setSelectedRide(fresh);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось обработать заявку';
      setError(message);
    } finally {
      setDecisionLoading(null);
    }
  }

  async function handleCancelRide(rideId: number) {
    if (!window.confirm('Вы уверены, что хотите отменить поездку? Действие нельзя будет отменить.')) return;
    setError(null);
    try {
      await cancelRideApi(rideId);
      setSelectedRide(null);
      setView('list');
      await refresh();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось отменить поездку';
      setError(message);
    }
  }

  function openRideDetail(ride: RideDTO) {
    setSelectedRide(ride);
    setView('detail');
  }

  const activeRides = myRides.filter((r) => r.status === RIDE_STATUS.ACTIVE);

  return (
    <PanelType {...props}>
      <PanelHeader before={<PanelHeaderBack onClick={() => view === 'list' ? routeNavigator.push('/') : setView('list')} />}>
        {view === 'detail' ? 'Детали поездки' : 'Водитель'}
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

      {/* List View - Simple panels for active trips */}
      {view === 'list' && (
        <Div style={{ paddingBottom: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
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
            activeRides.map((ride) => (
              <TripListItem
                key={ride.id}
                ride={ride}
                onClick={() => openRideDetail(ride)}
              />
            ))
          )}

          {myRides.length > 0 && (
            <Button
              size="l"
              stretched
              mode="secondary"
              onClick={refresh}
              style={{ marginTop: 12 }}
            >
              Обновить
            </Button>
          )}
        </Div>
      )}

      {/* Detail View - Full trip card with bookings */}
      {view === 'detail' && selectedRide && (
        <Div style={{ paddingBottom: 100 }}>
          <TripCard
            ride={selectedRide}
            bookings={selectedRide.bookings}
            mode="driver"
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Button
              size="l"
              stretched
              mode="secondary"
              onClick={() => handleCancelRide(selectedRide.id)}
            >
              Отменить поездку
            </Button>
          </div>

          {/* Pending bookings */}
          {selectedRide.bookings?.filter((b) => b.status === BOOKING_STATUS.PENDING).map((booking) => (
            <Card key={booking.id} mode="shadow" style={{ marginTop: 12 }}>
              <Div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontWeight: 500 }}>
                      {booking.passenger?.firstName} {booking.passenger?.lastName}
                    </Text>
                    <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
                      {booking.seatsBooked} мест ({(booking.seatIds || []).map((id) => SEATS.find((s) => s.id === id)?.label).join(', ')})
                    </Text>
                    {booking.passengerNote != null && booking.passengerNote !== '' && (
                      <Text style={{ fontSize: 13, color: 'var(--vkui--color_text_secondary)', fontStyle: 'italic', marginTop: 4 }}>
                        «{booking.passengerNote}»
                      </Text>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button
                      size="s"
                      mode="primary"
                      appearance="positive"
                      onClick={() => handleDecision(booking.id, BOOKING_STATUS.APPROVED)}
                      disabled={decisionLoading === booking.id}
                    >
                      {decisionLoading === booking.id ? '...' : 'Да'}
                    </Button>
                    <Button
                      size="s"
                      mode="secondary"
                      onClick={() => handleDecision(booking.id, BOOKING_STATUS.REJECTED)}
                      disabled={decisionLoading === booking.id}
                    >
                      Отклонить
                    </Button>
                  </div>
                </div>
              </Div>
            </Card>
          ))}
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

              {locationsError && (
                <Text style={{ color: 'var(--vkui-color-text-negative)', marginBottom: 12 }}>
                  {locationsError}
                </Text>
              )}
              <FormItem top="Откуда" required>
                <Select
                  placeholder="Выберите точку отправления"
                  value={form.fromId}
                  onChange={(e) => setForm((f) => ({ ...f, fromId: e.target.value, toId: f.toId === e.target.value ? '' : f.toId }))}
                  options={locations.filter((l) => l.id !== Number(form.toId)).map((l) => ({ label: l.name, value: String(l.id) }))}
                  disabled={locationsLoading}
                />
              </FormItem>

              <FormItem top="Куда" required>
                <Select
                  placeholder={form.fromId ? "Выберите точку назначения" : "Сначала выберите отправление"}
                  value={form.toId}
                  onChange={(e) => setForm((f) => ({ ...f, toId: e.target.value }))}
                  options={locations.filter((l) => l.id !== Number(form.fromId)).map((l) => ({ label: l.name, value: String(l.id) }))}
                  disabled={locationsLoading || !form.fromId}
                />
              </FormItem>

              <FormItem top="Дата и время">
                <Input
                  type="datetime-local"
                  value={form.departureTime}
                  onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
                />
              </FormItem>

              <FormItem top="Доступные места в автомобиле">
                <div style={{ marginBottom: 12 }}>
                  <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13, textAlign: 'center' }}>
                    Выберите места, на которые готовы посадить пассажиров
                  </Text>
                </div>
                <CarSeatMap
                  seats={SEATS}
                  selectedSeats={form.offeredSeats}
                  occupiedSeats={[]}
                  mode="create"
                  onSelectSeat={(id) => {
                    setForm((f) => ({
                      ...f,
                      offeredSeats: f.offeredSeats.includes(id)
                        ? f.offeredSeats.filter((s) => s !== id)
                        : [...f.offeredSeats, id],
                    }));
                  }}
                />
              </FormItem>

              <FormItem top="Условия и комментарий (необязательно)">
                <Textarea
                  placeholder="Например: пустой багажник, можно с животными"
                  value={form.driverNote}
                  onChange={(e) => setForm((f) => ({ ...f, driverNote: e.target.value }))}
                />
              </FormItem>

              <FormItem top="Цена, ₽">
                <Input
                  type="number"
                  min={0}
                  value={String(form.price)}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
                />
              </FormItem>

              <Button
                size="l"
                stretched
                mode="primary"
                appearance="positive"
                onClick={handleCreate}
                disabled={loading || form.offeredSeats.length === 0 || !form.fromId || !form.toId || !form.departureTime}
              >
                {loading ? 'Создание...' : 'Опубликовать'}
              </Button>
            </Div>
          </Card>
        </Div>
      )}
    </PanelType>
  );
}
