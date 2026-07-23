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
import '../styles.css';

type View = 'search' | 'results' | 'bookings';

export function PassengerPanel(props: React.ComponentProps<typeof PanelType>) {
  const routeNavigator = useRouteNavigator();
  const [view, setView] = useState<View>('search');
  const { locations, loading: locationsLoading, error: locationsError } = useLocations();
  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');
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
    // Abort any previous in-flight search
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const results = await searchRides({
        fromId: fromId ? Number(fromId) : undefined,
        toId: toId ? Number(toId) : undefined,
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
    // Prevent double-click (M7)
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
    setError(null); // Clear previous errors (L12)
    try {
      await cancelBookingApi(bookingId);
      const updatedBookings = await listMyBookings();
      setMyBookings(updatedBookings);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось отменить';
      setError(message);
    }
  }

  async function showMyBookings() {
    try {
      const updatedBookings = await listMyBookings();
      setMyBookings(updatedBookings);
      setView('bookings');
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить бронирования');
    }
  }

  const activeBookingCount = myBookings.filter(
    (b) => b.status === BOOKING_STATUS.PENDING || b.status === BOOKING_STATUS.APPROVED
  ).length;

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

      {/* Search View */}
      {view === 'search' && (
        <Div>
          <Card mode="shadow">
            <Div>
              <Title level="3" style={{ marginBottom: 16 }}>
                Найти поездку
              </Title>

              {/* Booking conditions */}
              <div style={{
                padding: 12,
                background: 'var(--vkui-color-background-secondary)',
                borderRadius: 8,
                marginBottom: 16,
              }}>
                <Text style={{ fontWeight: 500, marginBottom: 8 }}>
                  Ваши бронирования: {activeBookingCount} / {MAX_BOOKING_COUNT}
                </Text>
                <Text style={{ fontSize: 12, color: 'var(--vkui-color-text-secondary)' }}>
                  Максимум {MAX_BOOKING_COUNT} активных бронирований. Выберите места на схеме автомобиля. Нельзя бронировать поездки на одно и то же время.
                </Text>
              </div>

              {locationsError && (
                <Text style={{ color: 'var(--vkui-color-text-negative)', marginBottom: 12 }}>
                  {locationsError}
                </Text>
              )}
              <FormItem top="Откуда">
                <Select
                  placeholder="Выберите точку"
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  options={locations.map((l) => ({ label: l.name, value: String(l.id) }))}
                  disabled={locationsLoading}
                />
              </FormItem>

              <FormItem top="Куда">
                <Select
                  placeholder="Выберите точку"
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  options={locations.map((l) => ({ label: l.name, value: String(l.id) }))}
                  disabled={locationsLoading}
                />
              </FormItem>

              <Button
                size="l"
                stretched
                mode="primary"
                appearance="positive"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? 'Поиск...' : 'Найти поездки'}
              </Button>
            </Div>
          </Card>

          <Button
            size="l"
            stretched
            mode="secondary"
            onClick={showMyBookings}
            style={{ marginTop: 12 }}
          >
            Мои бронирования ({activeBookingCount})
          </Button>
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
                onClick={showMyBookings}
                style={{ marginTop: 12 }}
              >
                Мои бронирования
              </Button>
            </>
          )}
        </Div>
      )}

      {/* Bookings View */}
      {view === 'bookings' && (
        <Div style={{ paddingBottom: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Title level="3">Мои бронирования</Title>
            <Button
              size="s"
              mode="secondary"
              onClick={() => setView('search')}
            >
              Назад
            </Button>
          </div>

          {myBookings.length === 0 ? (
            <Card mode="shadow" style={{ textAlign: 'center', padding: 40 }}>
              <Title level="3" style={{ marginBottom: 8 }}>
                Нет бронирований
              </Title>
              <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
                Найдите поездку и забронируйте место
              </Text>
            </Card>
          ) : (
            myBookings.map((booking) => (
              <Card key={booking.id} mode="shadow" style={{ marginBottom: 12 }}>
                <Div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={{ fontWeight: 500 }}>
                          {booking.ride?.from?.name} → {booking.ride?.to?.name}
                        </Text>
                      </div>
                      <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
                        {booking.ride?.departureTime
                          ? formatRideDateTime(booking.ride.departureTime)
                          : '—'}
                        {' · '}{booking.seatsBooked} мест · {booking.ride?.price != null ? formatPrice(booking.ride.price) : '—'}
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: booking.status === BOOKING_STATUS.APPROVED
                          ? 'var(--vkui-color-text-positive)'
                          : booking.status === BOOKING_STATUS.REJECTED
                          ? 'var(--vkui-color-text-negative)'
                          : booking.status === BOOKING_STATUS.CANCELLED
                          ? 'var(--vkui-color-text-tertiary)'
                          : 'var(--vkui-color-text-secondary)',
                        marginTop: 4,
                      }}>
                        {booking.status === BOOKING_STATUS.PENDING && 'Ожидает подтверждения'}
                        {booking.status === BOOKING_STATUS.APPROVED && 'Подтверждено'}
                        {booking.status === BOOKING_STATUS.REJECTED && 'Отклонено'}
                        {booking.status === BOOKING_STATUS.CANCELLED && 'Отменено'}
                      </Text>
                    </div>

                    {(booking.status === BOOKING_STATUS.PENDING || booking.status === BOOKING_STATUS.APPROVED) && (
                      <Button
                        size="s"
                        mode="secondary"
                        onClick={() => handleCancelBooking(booking.id)}
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
