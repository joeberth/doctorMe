import { startOfHour, parseISO, isBefore } from 'date-fns';
import * as Yup from 'yup';
import { Op } from 'sequelize';
import Appointment from '../models/Appointment';
import User from '../models/User';

class AppointmentController {
  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      user_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body.data))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, date, user_id } = req.body.data;
    /**
     * Check if provider_id is a prrovider
     */

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });
    if (!isProvider) {
      return res
        .status(401)
        .json({ error: ' You can only create appointment with providers' });
    }

    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are nor permitted' });
    }

    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        user_id: {
          [Op.ne]: null,
        },
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id,
      provider_id,
      date: hourStart,
    });

    return res.json({
      appointment,
    });
  }

  async index(req, res) {
    const appointments = await Appointment.findAll({
      where: { provider_id: req.userId, canceled_at: null },
      order: ['date'],
    });

    return res.json({
      appointments,
    });
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id);

    if (appointment.provider_id !== req.userId) {
      return res.status(401).json({
        error: 'You dont have permission to cancel this appointment',
      });
    }

    appointment.canceled_at = new Date();

    await appointment.save;
    return res.json(appointment);
  }
}

export default new AppointmentController();
