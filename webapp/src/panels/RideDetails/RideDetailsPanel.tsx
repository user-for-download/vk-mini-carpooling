import { useEffect, useState, useRef } from 'react';
import {
  Panel,
  PanelHeader,
  PanelHeaderBack,
  Button,
  Text,
  Title,
  Div,
  Spinner,
} from '@vkontakte/vkui';
import { useParams, useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { RideDTO, BookingDTO } from '@local-blablacar/contracts';
import { BOOKING_STATUS } from '@local-blablacar/contracts';
import { getRide } from '../../api/rides';
import { createBooking, cancelBooking as cancelBookingApi, listMyBookings, updateBooking as updateBookingApi } from '../../api/bookings';
import { TripCard } from '../../components/TripCard';
import { ConfirmPopout } from '../../components/ConfirmPopout';
import { useRideDetails } from '../../hooks/useRideDetails';
import { useMyBookings } from '../../hooks/useMyBookings';
import '../../styles.css';

interface Props {
  nav: string;
}

export function RideDetailsPanel({ nav }: Props) {
  const routeNavigator = useRouteNavigator();
  const params = useParams<'id'>();
  const rideId = params?.id ? Number(params.id) : null;
  const { ride, setRide, notFound, isLoading } = useRideDetails(rideId);
  const { bookings: myBookings, refetch: refetchBookings } = useMyBookings();
  const [loading, setLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passengerNote, setPassengerNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  function isBooked(rideId: number): boolean {
    return myBookings.some((b) => b.rideId === rideId && (b.status === BOOKING_STATUS.PENDING || b.status === BOOKING_STATUS.APPROVED));
  }

  function getBookingForRide(rideId: number): BookingDTO | undefined {
    return myBookings.find((b) => b.rideId === rideId && (b.status === BOOKING_STATUS.PENDING || b.status === BOOKING_STATUS.APPROVED));
  }

  function openBookConfirm() {
    if (!ride || selectedSeats.length === 0) return;
    routeNavigator.showPopout(
      <ConfirmPopout
        title="Подтверждение"
        text={`Забронировать ${selectedSeats.length} мест(а)?`}
        onConfirm={processBook}
      />
    );
  }

  async function processBook() {
    if (!ride) return;
    setLoading(true);
    setError(null);
    try {
      await createBooking({ rideId: ride.id, seatIds: selectedSeats, passengerNote: passengerNote.trim() ? passengerNote.trim() : undefined });
      await refetchBookings();
      const updatedRide = await getRide(ride.id);
      setRide(updatedRide);
      setSelectedSeats([]);
      setPassengerNote('');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось забронировать';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function openCancelConfirm() {
    const booking = ride ? getBookingForRide(ride.id) : undefined;
    if (!booking) return;
    routeNavigator.showPopout(
      <ConfirmPopout
        title="Отмена брони"
        text="Вы уверены, что хотите отменить бронирование?"
        onConfirm={() => processCancel(booking.id)}
      />
    );
  }

  async function processCancel(bookingId: number) {
    setLoading(true);
    setError(null);
    try {
      await cancelBookingApi(bookingId);
      if (ride) {
        await refetchBookings();
        const updatedRide = await getRide(ride.id);
        setRide(updatedRide);
      }
      setIsEditing(false);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось отменить';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleStartEdit() {
    const booking = ride ? getBookingForRide(ride.id) : undefined;
    if (booking) {
      setSelectedSeats(booking.seatIds);
      setPassengerNote(booking.passengerNote || '');
    }
    setIsEditing(true);
  }

  function openUpdateConfirm() {
    const booking = ride ? getBookingForRide(ride.id) : undefined;
    if (!booking || selectedSeats.length === 0) return;
    routeNavigator.showPopout(
      <ConfirmPopout
        title="Изменение брони"
        text={`Изменить бронирование на ${selectedSeats.length} мест(а)?`}
        onConfirm={() => processUpdate(booking.id)}
      />
    );
  }

  async function processUpdate(bookingId: number) {
    setLoading(true);
    setError(null);
    try {
      await updateBookingApi(bookingId, { seatIds: selectedSeats, passengerNote: passengerNote.trim() ? passengerNote.trim() : null });
      if (ride) {
        await refetchBookings();
        const updatedRide = await getRide(ride.id);
        setRide(updatedRide);
      }
      setIsEditing(false);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось изменить бронирование';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const booked = ride ? isBooked(ride.id) : false;
  const currentBooking = ride ? getBookingForRide(ride.id) : undefined;

  return (
    <Panel nav={nav}>
      <PanelHeader
        before={
          <PanelHeaderBack
            onClick={() => !loading && routeNavigator.push('/passenger')}
            style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}
          />
        }
      >
        Детали поездки
      </PanelHeader>

      {error && (
        <Div>
          <div style={{ padding: 12, background: 'var(--vkui-color-background-negative)', borderRadius: 8 }}>
            <Text style={{ color: 'white' }}>{error}</Text>
            <Button
              size="s"
              mode="secondary"
              onClick={() => setError(null)}
              style={{ marginTop: 8 }}
            >
              Закрыть
            </Button>
          </div>
        </Div>
      )}

      {!ride && !notFound && (
        <Div style={{ textAlign: 'center', padding: 40 }}>
          <Spinner />
        </Div>
      )}

      {notFound && (
        <Div style={{ textAlign: 'center', padding: 40 }}>
          <Title level="3" style={{ marginBottom: 8 }}>
            Поездка не найдена
          </Title>
          <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
            Возможно, она уже завершена
          </Text>
        </Div>
      )}

      {ride && (
        <Div>
          <TripCard
            ride={ride}
            bookings={ride.bookings}
            excludeBookingId={currentBooking?.id}
            selectedSeats={isEditing ? selectedSeats : (currentBooking?.seatIds || selectedSeats)}
            passengerNote={isEditing ? passengerNote : (currentBooking?.passengerNote || passengerNote)}
            onPassengerNoteChange={setPassengerNote}
            onSelectSeat={(seatId) => {
              if (isBooked && !isEditing) return;
              setSelectedSeats((prev) =>
                prev.includes(seatId)
                  ? prev.filter((s) => s !== seatId)
                  : [...prev, seatId]
              );
            }}
            onBook={openBookConfirm}
            onUpdate={openUpdateConfirm}
            onCancel={isEditing ? () => setIsEditing(false) : openCancelConfirm}
            mode="passenger"
            isBooked={booked}
            bookingStatus={currentBooking?.status}
            isEditing={isEditing}
            onStartEdit={handleStartEdit}
          />
        </Div>
      )}
    </Panel>
  );
}
