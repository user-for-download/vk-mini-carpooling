import { useContext, useState, useRef, useCallback } from 'react';
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
import type { RideDTO } from '@local-blablacar/contracts';
import { MAX_BOOKING_COUNT, BOOKING_STATUS } from '@local-blablacar/contracts';
import { searchRides } from '../../api/rides';
import { createBooking, cancelBooking as cancelBookingApi } from '../../api/bookings';
import { TripCard } from '../../components/TripCard';
import { TripListItem } from '../../components/TripListItem';
import { ConfirmPopout } from '../../components/ConfirmPopout';
import { DataContext } from '../../context/dataContext';
import { useMyBookings } from '../../hooks/useMyBookings';
import { formatRideDateTime, formatPrice } from '../../utils/format';
import { SEATS } from '../../utils/constants';
import '../../styles.css';

type View = 'search' | 'results';

const STORAGE_KEY = 'passenger_search_state';

export function PassengerPanel(props: React.ComponentProps<typeof PanelType>) {
  const routeNavigator = useRouteNavigator();
  const ctx = useContext(DataContext);
  const locations = ctx?.locations ?? [];
  const { bookings: myBookings, setBookings: setMyBookings, refetch: refetchBookings } = useMyBookings();

  // Restore search state from sessionStorage on mount
  const savedState = (() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })();

  const [view, setView] = useState<View>(savedState?.view || 'search');
  const [fromId, setFromId] = useState<string>(savedState?.fromId || '');
  const [toId, setToId] = useState<string>(savedState?.toId || '');
  const [date, setDate] = useState<string>(savedState?.date || '');
  const [rides, setRides] = useState<RideDTO[] | null>(savedState?.rides || null);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Record<number, number[]>>({});
  const [showHistory, setShowHistory] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Save search state to sessionStorage whenever it changes
  const saveState = useCallback((newState: Partial<{ view: View; fromId: string; toId: string; date: string; rides: RideDTO[] | null }>) => {
    try {
      const current = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
      const updated = { ...current, ...newState };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }, []);

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
        // Save search state to sessionStorage
        saveState({ view: 'results', fromId, toId, date, rides: results });
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
      await refetchBookings();
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

  function openCancelBookingConfirm(bookingId: number) {
    routeNavigator.showPopout(
      <ConfirmPopout
        title="Отменить бронирование?"
        text="Вы уверены, что хотите отменить бронирование?"
        onConfirm={() => processCancelBooking(bookingId)}
      />
    );
  }

  async function processCancelBooking(bookingId: number) {
    setError(null);
    try {
      await cancelBookingApi(bookingId);
      await refetchBookings();
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

      {/* My Bookings Section - Collapsible */}
      <Div style={{ paddingBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level="3">Мои бронирования ({activeBookings.length}/{MAX_BOOKING_COUNT})</Title>
          <Button
            size="s"
            mode="refresh"
            onClick={refetchBookings}
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
            {/* Active bookings - always visible */}
            {activeBookings.length === 0 ? (
              <Card mode="shadow" style={{ textAlign: 'center', padding: 16 }}>
                <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13 }}>
                  Нет активных бронирований
                </Text>
              </Card>
            ) : (
              activeBookings.map((booking) => (
                <TripListItem
                  key={booking.id}
                  ride={{
                    id: booking.rideId,
                    price: booking.ride?.price || 0,
                    seatsAvailable: booking.ride?.seatsAvailable || 0,
                    departureTime: booking.ride?.departureTime || '',
                    from: booking.ride?.from,
                    to: booking.ride?.to,
                    bookings: [{ id: booking.id, status: booking.status, seatsBooked: booking.seatsBooked, seatIds: booking.seatIds }],
                  }}
                  onClick={() => routeNavigator.push(`/ride/${booking.rideId}`)}
                  rightElement={
                    <Button
                      size="s"
                      mode="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCancelBookingConfirm(booking.id);
                      }}
                    >
                      Отменить
                    </Button>
                  }
                />
              ))
            )}

            {/* History section - collapsible */}
            {historyBookings.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Button
                  size="s"
                  mode="tertiary"
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ marginBottom: showHistory ? 8 : 0 }}
                >
                  {showHistory ? '▲ Скрыть историю' : `▼ История (${historyBookings.length})`}
                </Button>

                {showHistory && (
                  <div style={{ marginTop: 8 }}>
                    {historyBookings.map((booking) => (
                      <TripListItem
                        key={booking.id}
                        ride={{
                          id: booking.rideId,
                          price: booking.ride?.price || 0,
                          seatsAvailable: booking.ride?.seatsAvailable || 0,
                          departureTime: booking.ride?.departureTime || '',
                          from: booking.ride?.from,
                          to: booking.ride?.to,
                        }}
                        dimmed
                      />
                    ))}
                  </div>
                )}
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

              <FormItem top="Откуда" required>
                <Select
                  placeholder="Выберите точку отправления"
                  value={fromId}
                  onChange={(e) => {
                    setFromId(e.target.value);
                    saveState({ fromId: e.target.value });
                  }}
                  options={locations.filter((l) => l.id !== Number(toId)).map((l) => ({ label: l.name, value: String(l.id) }))}
                />
              </FormItem>

              <FormItem top="Куда" required>
                <Select
                  placeholder={fromId ? "Выберите точку назначения" : "Сначала выберите отправление"}
                  value={toId}
                  onChange={(e) => {
                    setToId(e.target.value);
                    saveState({ toId: e.target.value });
                  }}
                  options={locations.filter((l) => l.id !== Number(fromId)).map((l) => ({ label: l.name, value: String(l.id) }))}
                  disabled={!fromId}
                />
              </FormItem>

              <FormItem top="Дата (необязательно)">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    saveState({ date: e.target.value });
                  }}
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
                onClick={() => {
                  setView('search');
                  saveState({ view: 'search', rides: null });
                }}
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
                  <TripListItem
                    key={ride.id}
                    ride={ride}
                    onClick={() => routeNavigator.push(`/ride/${ride.id}`)}
                    rightElement={
                      <Button
                        size="s"
                        mode={booked ? 'secondary' : 'primary'}
                        appearance={booked ? 'neutral' : 'positive'}
                        onClick={(e) => {
                          e.stopPropagation();
                          routeNavigator.push(`/ride/${ride.id}`);
                        }}
                      >
                        {booked ? 'Забронировано' : 'Подробнее'}
                      </Button>
                    }
                  />
                );
              })}

              <Button
                size="l"
                stretched
                mode="secondary"
                onClick={() => {
                  setView('search');
                  saveState({ view: 'search', rides: null });
                }}
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
