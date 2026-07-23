import { useEffect, useState, useRef, useCallback } from 'react';
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
  Spinner,
} from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { RideDTO, BookingDTO } from '@local-blablacar/contracts';
import { MAX_BOOKING_COUNT, BOOKING_STATUS } from '@local-blablacar/contracts';
import { searchRides } from '../api/rides';
import { createBooking, cancelBooking as cancelBookingApi, listMyBookings } from '../api/bookings';
import { TripCard } from '../components/TripCard';
import { useLocations } from '../hooks/useLocations';
import { formatRideDateTime, formatPrice } from '../utils/format';
import { SEATS } from '../utils/constants';
import '../styles.css';

type View = 'search' | 'results';

export function PassengerPanel(props: React.ComponentProps<typeof PanelType>) {
  const routeNavigator = useRouteNavigator();
  const [view, setView] = useState<View>('search');
  const { locations, loading: locationsLoading, error: locationsError } = useLocations();
  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [rides, setRides] = useState<RideDTO[] | null>(null);
  const [myBookings, setMyBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Record<number, number[]>>({});
  const ignoreRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // Refetch bookings helper
  const fetchBookings = useCallback(async () => {
    try {
      const data = await listMyBookings();
      if (!ignoreRef.current) setMyBookings(data);
    } catch (err) {
      if (!ignoreRef.current) {
        console.error(err);
        setError('Не удалось загрузить бронирования');
      }
    }
  }, []);

  // Fetch on mount and refetch when panel becomes active
  useEffect(() => {
    ignoreRef.current = false;
    fetchBookings();
    return () => { ignoreRef.current = true; };
  }, [fetchBookings]);

  async function handleSearch() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const results = await searchRides({
        fromId: fromId ? Number(fromId) : undefined,
        toId: toId ? Number(toId) : undefined,
        date: date || undefined,
      }, controller.signal);
      if (!controller.signal.aborted) {
        setRides(results);
        setView('results');
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      console.error('Search error:', err);
      setError('Не удалось выполнить поиск. Попробуйте позже.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  async function handleBook(rideId: number) {
    const seats = selectedSeats[rideId] || [];
    if (seats.length === 0) return;
    if (bookingLoading === rideId) return;
    setBookingLoading(rideId);
    setError(null);
    try {
      await createBooking({ rideId, seatIds: seats });
      const updatedBookings = await listMyBookings();
      setMyBookings(updatedBookings);
      setSelectedSeats((prev) => {
        const next = { ...prev };
        delete next[rideId];
        return next;
      });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось забронировать';
      setError(message);
    } finally {
      setBookingLoading(null);
    }
  }

  function isBooked(rideId: number): boolean {
    return myBookings.some((b) => b.rideId === rideId && (b.status === BOOKING_STATUS.PENDING || b.status === BOOKING_STATUS.APPROVED));
  }

  async function handleCancelBooking(bookingId: number) {
    if (!window.confirm('Вы уверены, что хотите отменить бронирование?')) return;
    setError(null);
    try {
      await cancelBookingApi(bookingId);
      const updatedBookings = await listMyBookings();
      setMyBookings(updatedBookings);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось отменить';
      setError(message);
    }
  }

  const activeBookings = myBookings.filter(
    (b) => b.status === BOOKING_STATUS.PENDING || b.status === BOOKING_STATUS.APPROVED
  );

  const historyBookings = myBookings.filter(
    (b) => b.status === BOOKING_STATUS.REJECTED || b.status === BOOKING_STATUS.CANCELLED
  );

  return (
    <PanelType {...props}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.push('/')} />}>
        Пассажир
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

      {/* My Bookings Section - Always visible at top */}
      <Div style={{ paddingBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level="3">Мои бронирования ({activeBookings.length}/{MAX_BOOKING_COUNT})</Title>
          <Button
            size="s"
            mode="refresh"
            onClick={fetchBookings}
          >
            Обновить
          </Button>
        </div>

        {myBookings.length === 0 ? (
          <Card mode="shadow" style={{ textAlign: 'center', padding: 20 }}>
            <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
              У вас пока нет бронирований
            </Text>
          </Card>
        ) : (
          <>
            {/* Active bookings */}
            {activeBookings.map((booking) => (
              <Card
                key={booking.id}
                mode="shadow"
                style={{ marginBottom: 8, cursor: 'pointer' }}
                onClick={() => routeNavigator.push(`/ride/${booking.rideId}`)}
              >
                <Div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontWeight: 500, marginBottom: 2 }}>
                        {booking.ride?.from?.name} → {booking.ride?.to?.name}
                      </Text>
                      <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
                        {booking.ride?.departureTime ? formatRideDateTime(booking.ride.departureTime) : '—'}
                        {' · '}{booking.seatsBooked} мест · {booking.ride?.price != null ? formatPrice(booking.ride.price) : '—'}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Text style={{
                          fontSize: 12,
                          color: booking.status === BOOKING_STATUS.APPROVED
                            ? 'var(--vkui-color-text-positive)'
                            : 'var(--vkui-color-text-secondary)',
                        }}>
                          {booking.status === BOOKING_STATUS.APPROVED ? 'Подтверждено' : 'Ожидает'}
                        </Text>
                        {booking.seatIds && booking.seatIds.length > 0 && (
                          <Text style={{ fontSize: 11, color: 'var(--vkui-color-text-tertiary)' }}>
                            ({booking.seatIds.map((id) => SEATS.find((s) => s.id === id)?.label).join(', ')})
                          </Text>
                        )}
                      </div>
                    </div>
                    <Button
                      size="s"
                      mode="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelBooking(booking.id);
                      }}
                    >
                      Отменить
                    </Button>
                  </div>
                </Div>
              </Card>
            ))}

            {/* History bookings */}
            {historyBookings.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text style={{ color: 'var(--vkui-color-text-tertiary)', fontSize: 12, marginBottom: 8 }}>
                  История
                </Text>
                {historyBookings.slice(0, 5).map((booking) => (
                  <Card key={booking.id} mode="shadow" style={{ marginBottom: 8, opacity: 0.6 }}>
                    <Div style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text style={{ fontSize: 13 }}>
                            {booking.ride?.from?.name} → {booking.ride?.to?.name}
                          </Text>
                          <Text style={{
                            fontSize: 11,
                            color: booking.status === BOOKING_STATUS.REJECTED
                              ? 'var(--vkui-color-text-negative)'
                              : 'var(--vkui-color-text-tertiary)',
                          }}>
                            {booking.status === BOOKING_STATUS.REJECTED ? 'Отклонено' : 'Отменено'}
                          </Text>
                        </div>
                      </div>
                    </Div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </Div>

      {/* Search Section */}
      {view === 'search' && (
        <Div>
          <Card mode="shadow">
            <Div>
              <Title level="3" style={{ marginBottom: 16 }}>
                Найти поездку
              </Title>

              {locationsError && (
                <Text style={{ color: 'var(--vkui-color-text-negative)', marginBottom: 12 }}>
                  {locationsError}
                </Text>
              )}
              <FormItem top="Откуда" required>
                <Select
                  placeholder="Выберите точку отправления"
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  options={locations.filter((l) => l.id !== Number(toId)).map((l) => ({ label: l.name, value: String(l.id) }))}
                  disabled={locationsLoading}
                />
              </FormItem>

              <FormItem top="Куда" required>
                <Select
                  placeholder={fromId ? "Выберите точку назначения" : "Сначала выберите отправление"}
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  options={locations.filter((l) => l.id !== Number(fromId)).map((l) => ({ label: l.name, value: String(l.id) }))}
                  disabled={locationsLoading || !fromId}
                />
              </FormItem>

              <FormItem top="Дата (необязательно)">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--vkui-color-separator)',
                    background: 'var(--vkui-color-background-primary)',
                    fontSize: '16px',
                  }}
                />
              </FormItem>

              <Button
                size="l"
                stretched
                mode="primary"
                appearance="positive"
                onClick={handleSearch}
                disabled={loading || !fromId || !toId}
              >
                {loading ? 'Поиск...' : 'Найти поездки'}
              </Button>
            </Div>
          </Card>
        </Div>
      )}

      {/* Results View */}
      {view === 'results' && rides && (
        <Div style={{ paddingBottom: 100 }}>
          {rides.length === 0 ? (
            <Card mode="shadow" style={{ textAlign: 'center', padding: 40 }}>
              <Title level="3" style={{ marginBottom: 8 }}>
                Ничего не найдено
              </Title>
              <Text style={{ color: 'var(--vkui-color-text-secondary)', marginBottom: 24 }}>
                Попробуйте выбрать другие точки
              </Text>
              <Button
                size="l"
                mode="primary"
                appearance="positive"
                onClick={() => setView('search')}
              >
                Новый поиск
              </Button>
            </Card>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
                  Найдено поездок: {rides.length}
                </Text>
                <Button
                  size="s"
                  mode="secondary"
                  onClick={() => setView('search')}
                >
                  Изменить поиск
                </Button>
              </div>

              {rides.map((ride) => {
                const booked = isBooked(ride.id);
                return (
                  <Card key={ride.id} mode="shadow" style={{ marginBottom: 12 }}>
                    <Div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Title level="3" style={{ color: 'var(--vkui-color-text-accent)', marginBottom: 4 }}>
                            {formatPrice(ride.price)}
                          </Title>
                          <Text style={{ marginBottom: 4 }}>
                            {ride.from?.name} → {ride.to?.name}
                          </Text>
                          <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
                            {formatRideDateTime(ride.departureTime)}
                            {' · '}{ride.seatsAvailable} мест
                          </Text>
                        </div>
                        <Button
                          size="s"
                          mode={booked ? 'secondary' : 'primary'}
                          appearance={booked ? 'neutral' : 'positive'}
                          onClick={() => routeNavigator.push(`/ride/${ride.id}`)}
                        >
                          {booked ? 'Забронировано' : 'Подробнее'}
                        </Button>
                      </div>
                    </Div>
                  </Card>
                );
              })}

              <Button
                size="l"
                stretched
                mode="secondary"
                onClick={() => setView('search')}
                style={{ marginTop: 12 }}
              >
                Новый поиск
              </Button>
            </>
          )}
        </Div>
      )}
    </PanelType>
  );
}
