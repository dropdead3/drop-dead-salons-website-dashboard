import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { LocationStep } from './LocationStep';
import { DateStep } from './DateStep';
import { StylistInfoStep } from './StylistInfoStep';
import { AgreementStep } from './AgreementStep';
import { ConfirmationStep } from './ConfirmationStep';

export interface BookingData {
  location_id: string;
  location_name: string;
  location_address: string;
  booking_date: string;
  daily_rate: number;
  stylist_name: string;
  stylist_email: string;
  stylist_phone: string;
  license_number: string;
  license_state: string;
  business_name?: string;
  instagram_handle?: string;
  agreement_signed_at?: string;
  agreement_version?: string;
  booking_id?: string;
}

const STEPS = [
  { id: 'location', title: 'Select Location' },
  { id: 'date', title: 'Choose Date' },
  { id: 'info', title: 'Your Information' },
  { id: 'agreement', title: 'Review Agreement' },
  { id: 'confirmation', title: 'Confirmation' },
] as const;

type StepId = typeof STEPS[number]['id'];

export function BookingWizard() {
  const [currentStep, setCurrentStep] = useState<StepId>('location');
  const [bookingData, setBookingData] = useState<Partial<BookingData>>({});

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
  };

  const goToStep = (step: StepId) => {
    setCurrentStep(step);
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-2">
            DAY RATE BOOKING
          </h1>
          <p className="text-muted-foreground">
            Rent a chair for a day at any of our locations
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index < currentStepIndex
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStepIndex
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-1 ${
                      index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Title */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-medium">{STEPS[currentStepIndex].title}</h2>
        </div>

        {/* Back Button */}
        {currentStepIndex > 0 && currentStep !== 'confirmation' && (
          <Button
            variant="ghost"
            onClick={goBack}
            className="mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        {/* Step Content */}
        <Card className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentStep === 'location' && (
                <LocationStep
                  selectedLocationId={bookingData.location_id}
                  onSelect={(location) => {
                    updateBookingData({
                      location_id: location.id,
                      location_name: location.name,
                      location_address: `${location.address}, ${location.city}`,
                      daily_rate: location.day_rate_default_price || 150,
                    });
                    goNext();
                  }}
                />
              )}

              {currentStep === 'date' && (
                <DateStep
                  locationId={bookingData.location_id!}
                  selectedDate={bookingData.booking_date}
                  onSelect={(date) => {
                    updateBookingData({ booking_date: date });
                    goNext();
                  }}
                />
              )}

              {currentStep === 'info' && (
                <StylistInfoStep
                  initialData={bookingData}
                  onSubmit={(data) => {
                    updateBookingData(data);
                    goNext();
                  }}
                />
              )}

              {currentStep === 'agreement' && (
                <AgreementStep
                  bookingData={bookingData as BookingData}
                  onAccept={(agreementData) => {
                    updateBookingData(agreementData);
                    goNext();
                  }}
                />
              )}

              {currentStep === 'confirmation' && (
                <ConfirmationStep
                  bookingData={bookingData as BookingData}
                  onNewBooking={() => {
                    setBookingData({});
                    setCurrentStep('location');
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
