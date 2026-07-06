import { motion, useReducedMotion } from "framer-motion";
import { Clock, ExternalLink, MapPin, Phone, ShieldCheck, Building } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Pharmacy } from "@/types";

interface PharmacyCardProps {
  pharmacy: Pharmacy;
}

export const PharmacyCard = ({ pharmacy }: PharmacyCardProps) => {
  const shouldReduceMotion = useReducedMotion();

  const mapUrl = pharmacy.lat && pharmacy.lng
    ? `https://maps.google.com/?q=${pharmacy.lat},${pharmacy.lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(pharmacy.location)}`;

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={shouldReduceMotion ? {} : { y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="relative h-full">
        {pharmacy.is_partner && (
          <div className="absolute right-3 top-3">
            <Badge variant="success">
              <ShieldCheck className="mr-1 h-3 w-3" />
              FCN Partner
            </Badge>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
            {pharmacy.name}
          </h3>

          <div className="space-y-2 text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fcn-primary" />
              <span>{pharmacy.location}</span>
            </div>

            {pharmacy.distance_km !== null && pharmacy.distance_km !== undefined && (
              <p className="text-xs text-fcn-primary">{pharmacy.distance_km} km away</p>
            )}

            {pharmacy.opening_hours && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0 text-fcn-primary" />
                <span className="text-xs">{pharmacy.opening_hours}</span>
              </div>
            )}

            {pharmacy.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-fcn-primary" />
                <a href={`tel:${pharmacy.phone}`} className="hover:text-fcn-primary">
                  {pharmacy.phone}
                </a>
              </div>
            )}
          </div>

          {pharmacy.hospital_links && pharmacy.hospital_links.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Building className="h-3.5 w-3.5 text-fcn-primary/60" />
              {pharmacy.hospital_links.map((link) => (
                <span
                  key={link.hospital_id}
                  className="rounded-full bg-fcn-primary/10 px-2 py-0.5 text-xs text-fcn-primary"
                >
                  {link.hospital_name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Badge variant={pharmacy.status === "ACTIVE" ? "success" : "warning"}>
              {pharmacy.status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              icon={<ExternalLink className="h-3.5 w-3.5" />}
              onClick={() => window.open(mapUrl, "_blank")}
            >
              Get Directions
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
