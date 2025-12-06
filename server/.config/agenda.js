import Agenda from 'agenda';


export const agenda = new Agenda({
db: { address: process.env.MONGO_URI, collection: 'agendaJobs' },
});


agenda.on('ready', () => console.log('📆 Agenda connected to MongoDB'));