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
} from '@vkontakte/vkui';
import { useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { LocationDTO, RideDTO, BookingDTO } from '@local-blablacar/contracts';
import { listLocations } from '../api/locations';
import { searchRides } from '../api/rides';
import { createBooking, cancelBooking as cancelBookingApi, listMyBookings } from '../api/bookings';
import { BOOKING_STATUS } from '@local-blablacar/contracts';
import { TripCard } from '../components/TripCard';
import '../styles.css';

type View = 'search' | 'results' | 'bookings';

const MAX_BOOKING_COUNT = 5;

export function PassengerPanel(props: React.ComponentProps<typeof PanelType>) {
  const routeNavigator = useRouteNavigator();
  const [view, setView] = useState<View>('search');
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');
  const [rides, setRides] = useState<RideDTO[] | null>(null);
  const [myBookings, setMyBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<{ [rideId: number]: number }>({});

  useEffect(() => {
    listLocations().then(setLocations).catch(console.error);
    listMyBookings().then(setMyBookings).catch(console.error);
  }, []);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    try {
      const results = await searchRides({
        fromId: fromId ? Number(fromId) : undefined,
        toId: toId ? Number(toId) : undefined,
      });
      console.log('Search results:', results.length);
      setRides(results);
      setView('results');
      console.log('View set to results');
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(rideId: number) {
    const seats = selectedSeats[rideId] || [];
    if (seats.length === 0) return;
    setBookingLoading(rideId);
    setError(null);
    try {
      await createBooking({ rideId, seatsBooked: seats.length });
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
    return myBookings.some((b) => b.rideId === rideId);
  }

  async function handleCancelBooking(bookingId: number) {
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
    const updatedBookings = await listMyBookings();
    setMyBookings(updatedBookings);
    setView('bookings');
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

              <FormItem top="Откуда">
                <Select
                  placeholder="Выберите точку"
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  options={locations.map((l) => ({ label: l.name, value: String(l.id) }))}
                />
              </FormItem>

              <FormItem top="Куда">
                <Select
                  placeholder="Выберите точку"
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  options={locations.map((l) => ({ label: l.name, value: String(l.id) }))}
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
        <Div>
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
                const rideSelectedSeats = selectedSeats[ride.id] || [];
                return (
                  <div key={ride.id} style={{ marginBottom: 12 }}>
                    <TripCard
                      ride={ride}
                      selectedSeats={rideSelectedSeats}
                      onSelectSeat={(seatId) => {
                        setSelectedSeats((prev) => {
                          const current = prev[ride.id] || [];
                          const next = current.includes(seatId)
                            ? current.filter((s) => s !== seatId)
                            : [...current, seatId];
                          return { ...prev, [ride.id]: next };
                        });
                      }}
                      onBook={() => handleBook(ride.id)}
                      onCancel={() => {
                        const booking = myBookings.find((b) => b.rideId === ride.id);
                        if (booking) handleCancelBooking(booking.id);
                      }}
                      mode="passenger"
                      isBooked={booked}
                    />
                  </div>
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
        <Div>
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
                          ? new Date(booking.ride.departureTime).toLocaleString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                        {' · '}{booking.seatsBooked} мест · {booking.ride?.price} ₽
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: booking.status === BOOKING_STATUS.APPROVED
                          ? 'var(--vkui-color-text-positive)'
                          : booking.status === BOOKING_STATUS.REJECTED
                          ? 'var(--vkui-color-text-negative)'
                          : 'var(--vkui-color-text-secondary)',
                        marginTop: 4,
                      }}>
                        {booking.status === BOOKING_STATUS.PENDING && 'Ожидает подтверждения'}
                        {booking.status === BOOKING_STATUS.APPROVED && 'Подтверждено'}
                        {booking.status === BOOKING_STATUS.REJECTED && 'Отклонено'}
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
