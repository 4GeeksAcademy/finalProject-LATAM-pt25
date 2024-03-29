import React, { useState, useEffect, useContext } from 'react';
import { Context } from "../store/appContext";
import "../../styles/calendar.css";
import { FaTimes } from 'react-icons/fa';
import { FaChevronLeft } from 'react-icons/fa';
import { FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export const SchedulingNonRegistered = ({ formData }) => {
    const { actions } = useContext(Context);
    const [calendar, setCalendar] = useState([]);
    const [month, setMonth] = useState(1); // empieza en enero
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedDay, setSelectedDay] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedHour, setSelectedHour] = useState(null);
    const [selectedHours, setSelectedHours] = useState([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();
    const [extractedInfo, setExtractedInfo] = useState([]);

    const closeShowSuccessModal = () => {
        handleCloseModal();
        setShowSuccessModal(false)

    };

    useEffect(() => {
        const currentDate = new Date(year, month - 1, 1);
        const firstDayOfWeek = currentDate.getDay();
        let day = 1;

        const newCalendar = [];

        for (let i = 0; i < 6; i++) {
            const row = [];

            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDayOfWeek) {
                    row.push('');
                } else if (day <= 31) {
                    row.push(day);
                    day++;
                } else {
                    row.push('');
                }
            }
            newCalendar.push(row);
        }
        setCalendar(newCalendar);
    }, [year, month]);

    const handleNextMonth = () => {
        if (month === 12) {
            setYear(year => year + 1);
            setMonth(1);
        } else {
            setMonth(month => month + 1);
        }
    };

    const handlePreviousMonth = () => {
        if (month === 1) {
            setYear(year => year - 1);
            setMonth(12);
        } else {
            setMonth(month => month - 1);
        }
    };

    const handleDayClick = (day) => {
        const selectedDate = new Date(year, month - 1, day);
        const currentDate = new Date();

        if (selectedDate < currentDate) {
            setSelectedHours([]);
            setSelectedDay(null);
            setShowModal(false);
            return;
        }

        if (day) {
            setSelectedDay(day);
            setShowModal(true);
        } else {
            setShowModal(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedHours([])
    };

    const handleSelectHours = (data) => {
        const isSelected = selectedHours.find(item => item.id === data.id);
        if (isSelected) {
            setSelectedHours([]);
            setSelectedHour(null);
        } else {
            setSelectedHours([data]);
            setSelectedHour(data.time);
        }
    };

    const handleReservation = async () => {
        const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}T${selectedHour.toString().padStart(2, '0')}:00:00`;

        const guestName = `${formData.name} ${formData.lastname}`;

        const reservationData = {
            date: formattedDate,
            guest_name: guestName,
            guest_phone: formData.phone,
        };

        try {
            const response = await actions.createReservationForNonRegisteredUser(reservationData);
            if (response && response.message === 'Reservation created successfully') {
                setShowSuccessModal(true);

            } else {
                setShowSuccessModal(true);
                console.error('Error al realizar la reserva:', response && response.error ? response.error : 'Error desconocido');
            }
        } catch (error) {
            console.error('Error al realizar la reserva:', error);
        }
    };

    const meses = {
        1: 'Enero',
        2: 'Febrero',
        3: 'Marzo',
        4: 'Abril',
        5: 'Mayo',
        6: 'Junio',
        7: 'Julio',
        8: 'Agosto',
        9: 'Septiembre',
        10: 'Octubre',
        11: 'Noviembre',
        12: 'Diciembre'
    };

    const renderModalContent = () => {
        const hours = Array.from({ length: 12 }, (_, index) => index + 8);
        return (
            <div>
                <div className='d-flex justify-content-between align-items-center mb-2' style={{ fontFamily: 'Nanum Gothic, sans-serif' }}>
                    <div>
                        <h5>Disponibilidad {selectedDay} de {meses[month]}, {year}</h5>
                    </div>
                    <div>
                        <FaTimes onClick={handleCloseModal} style={{ cursor: 'pointer', color: 'grey' }} />
                    </div>
                </div>
                <div className="row">
                    {hours.map((hour, index) => {
                        const data = {
                            date: `2024-${month > 9 ? '' : '0'}${month}-${selectedDay > 9 ? '' : '0'}${selectedDay} ${hour > 9 ? '' : '0'}${hour}:00:00`,
                            time: hour,
                            id: `2024${month > 9 ? '' : '0'}${month}${selectedDay > 9 ? '' : '0'}${selectedDay}${hour > 9 ? '' : '0'}${hour}`,
                        };
                        const matchingHour = extractedInfo.some((item) => (
                            item.year === 2024 &&
                            item.month === month &&
                            item.day === selectedDay &&
                            item.hour === hour
                        ));
                        const isSelected = selectedHours.find(item => item.id === data.id);
                        return (
                            <div key={hour} className="col-lg-4 col-md-4 col-sm-6 mb-2">
                                <div
                                    onClick={() => handleSelectHours(data)}
                                    className={`card border ${matchingHour ? "border-danger" : ""} ${isSelected ? "selected" : ""}`}
                                    style={{ height: '100%', cursor: 'pointer' }}
                                >
                                    <div className="card-body d-flex align-items-center justify-content-center">
                                        <p className="card-title mb-0">{hour}:00 - {hour + 1}:00</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="row mx-1 mt-2">
                    <button className='btn_horasPorFecha btn-block' onClick={handleReservation}>Reservar
                    </button>
                </div>
                <div className={`modal fade ${showSuccessModal ? 'show d-block' : 'd-none'}`} id="successModal" tabIndex="-1" aria-labelledby="successModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content" style={{ textAlign: 'left' }} id="contactModal">
                            <div className="modal-header justify-content-between">
                                <div>
                                    <span>Su turno ha sido agendado con exito</span>
                                </div>
                                <div>
                                    <button type="button" className="btn_close_contact" onClick={closeShowSuccessModal} aria-label="Close">X</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className='d-flex'>
            <div className="left-content mt-2" style={{ marginRight: '5vh', fontFamily: 'Nanum Gothic, sans-serif' }}>
                <div className="calendar-header d-flex justify-content-between aling-items-center">
                    <div className="button-container">
                        <FaChevronLeft style={{ color: 'grey' }} onClick={handlePreviousMonth} />
                    </div>
                    <h5 className='mt-2'>{meses[month]} de {year}</h5>
                    <div className="button-container">
                        <FaChevronRight style={{ color: 'grey' }} onClick={handleNextMonth} />
                    </div>
                </div>
                <table className="calendar" style={{ color: '#7E7E7E' }}>
                    <thead style={{ backgroundColor: '#FAFAFA' }}>
                        <tr>
                            <th style={{ width: '14.28%' }}>Domingo</th>
                            <th style={{ width: '14.28%' }}>Lunes</th>
                            <th style={{ width: '14.28%' }}>Martes</th>
                            <th style={{ width: '14.28%' }}>Miércoles</th>
                            <th style={{ width: '14.28%' }}>Jueves</th>
                            <th style={{ width: '14.28%' }}>Viernes</th>
                            <th style={{ width: '14.28%' }}>Sábado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {calendar.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <td key={cellIndex} className='pestanita' onClick={() => handleDayClick(cell)}>
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div>
                {showModal ? (
                    <div className='mt-4'>
                        {renderModalContent()}
                    </div>
                ) : (
                    <div className="no-selection-container d-flex justify-content-center align-items-center" style={{ backgroundColor: '#FAFAFA', color: 'grey', padding: '20px', height: '100%', width: '125%' }}>
                        No se ha seleccionado ninguna fecha del calendario
                    </div>
                )}
            </div>
        </div>
    );
};
