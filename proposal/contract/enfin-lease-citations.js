'use strict';
// Verified quotations from the single source contract "CA Lease - Sample Contract (1).pdf" (EnFin Lease 2.2).
// Page numbers: printedPage is the number printed in the agreement page header; pdfPage is the page of the combined PDF.
// Exhibit pages carry no printed agreement page number, so they are located by PDF page and footer.
// Line convention: lines are counted on the page starting at 1 for the first text line below the page header
// (the line containing info@enfin.com), blank lines included, as extracted from the PDF text layer.
// Quote text is the page text for exactly that line range; only PDF text-extraction artifacts (broken words,
// substituted quotation marks) were normalised. Do not edit quotations without re-verifying against the PDF.
(function(){
const D = Object.freeze({
 "ENFIN-CONTRACTOR-01": {
  "id": "ENFIN-CONTRACTOR-01",
  "section": "Section 1 - Contractor and maintenance",
  "printedPage": 18,
  "pdfPage": 44,
  "pageLabel": "Printed page 18",
  "lines": [
   7,
   10
  ],
  "quote": "… associated with this Contract. EnFin will designate a Contractor to design and install the System and that designated Contractor (“Contractor”) will perform all required design work and installation. EnFin will also be responsible for the maintenance, service, or repairs on the System, through contractors that it designates."
 },
 "ENFIN-TERM-01": {
  "id": "ENFIN-TERM-01",
  "section": "Section 2 - Initial Term",
  "printedPage": 18,
  "pdfPage": 44,
  "pageLabel": "Printed page 18",
  "lines": [
   12,
   15
  ],
  "quote": "EnFin agrees to lease you the System for twenty-five (25) years from the Commercial Operation Date. We refer to this period of time as the “Initial Term.” The Initial Term begins on the Commercial Operation Date. The “Commercial Operation Date” is the date that the System is turned on and generating power. EnFin will notify you by email, text or mail when your System is ready to be turned on."
 },
 "ENFIN-TERM-02": {
  "id": "ENFIN-TERM-02",
  "section": "Section 2 - Automatic renewal and cancellation",
  "printedPage": 18,
  "pdfPage": 44,
  "pageLabel": "Printed page 18",
  "lines": [
   16,
   25
  ],
  "quote": "Automatic Renewal Term. If you do not choose to cancel this Agreement or to exercise your purchase option as described in Section 10 by the end of the Initial Term, this Agreement will automatically renew for an additional 5 year term (each, an “Additional Term,” and all Additional Terms and the Initial Term together, the “Term”) provided that EnFin Corp will make commercially reasonable efforts to give you written notice (“Renewal Notice”) of this automatic renewal between fifteen (15) days and forty-five (45) days before the end of the Initial Term or applicable Additional Term. You may cancel the Additional Term by calling our toll-free number identified in this Agreement or providing us with written notice via e-mail at least ten (10) days before the expiration of any Term. This Agreement will renew for a maximum of two (2) additional Terms. At the end of the second renewal Term, You will be able to purchase the System or request that it be removed in accordance with Section 18 of this Agreement."
 },
 "ENFIN-TERM-03": {
  "id": "ENFIN-TERM-03",
  "section": "Section 2 - Additional Term payment and battery charge",
  "printedPage": 18,
  "pdfPage": 44,
  "pageLabel": "Printed page 18",
  "lines": [
   26,
   31
  ],
  "quote": "The Renewal Notice will set forth the new monthly payments you will owe for the Additional Term, provide the renewal terms, cancellation policy, and information on how to terminate the Agreement. The Additional Term Monthly Payment amount due will include a fixed charge of one hundred dollars ($100) for each battery installed as part of your System. Invoices for Additional Term Monthly Payments will be mailed or emailed no later than ten (10) days after the close of the billing cycle and will be due no late r than thirty (30) days after the date of the invoice."
 },
 "ENFIN-PAY-01": {
  "id": "ENFIN-PAY-01",
  "section": "Section 4(a) - Monthly Payment",
  "printedPage": 19,
  "pdfPage": 45,
  "pageLabel": "Printed page 19",
  "lines": [
   9,
   15
  ],
  "quote": "(a) Monthly Payment. The summary table at the beginning of this Agreement details, among other things, (i) the estimated price you will pay each month of the Term (each, a “ Monthly Payment ”), including your first Monthly Payment; (ii) the annual price escalator (if any); and (iii) the estimated amount you will pay over the Term. Your billing cycles run on a monthly basis. Your first billing cycle will begin on the date EnFin confirms the Solar System is placed in service by your Utility (the “ In- Service Date”). Subsequent billing cycles will be on a recurring basis every thirty (30) days after the In-Service Date."
 },
 "ENFIN-INS-01": {
  "id": "ENFIN-INS-01",
  "section": "Section 5(a)(xii) - Homeowner insurance",
  "printedPage": 20,
  "pdfPage": 46,
  "pageLabel": "Printed page 20",
  "lines": [
   19,
   26
  ],
  "quote": "(xii) carry insurance covering damage to the Home, including damage resulting from the Solar System and not due to the gross negligence of EnFin. It is your responsibility to determine whether the installation of the System will impact your existing coverage and whether additional insurance will be required. Placing a distributed energy generation system on your roof may impact your future insurance premiums. You are responsible for contacting your insurance carrier, prior to entering into a purchase or lease agreement, to confirm whether your current policy or coverage will need to be modified upon installing the distributed energy generation system onto your dwelling."
 },
 "ENFIN-INS-02": {
  "id": "ENFIN-INS-02",
  "section": "Section 5(b)(vi)-(vii) - EnFin insurance and property damage",
  "printedPage": 21,
  "pdfPage": 47,
  "pageLabel": "Printed page 21",
  "lines": [
   4,
   10
  ],
  "quote": "(vi) insure the System against all damage or loss unless (A) that damage or loss is caused by your gross negligence; or (B) you intentionally damage the System; Upon damage or destruction to the System, you will not be entitled to receive or retain any insurance proceeds. In cases where we bear the risk of loss, our sole obligation to you will be to repair or replace the System to the extent required by the Warranty; (vii) insure our actions, and those of any Contractor that we designate, covering damages to your property caused by faulty installation, System malfunction or manufacturing defects;"
 },
 "ENFIN-REROOF-01": {
  "id": "ENFIN-REROOF-01",
  "section": "Section 5(c) - Roof or property work that affects the System",
  "printedPage": 21,
  "pdfPage": 47,
  "pageLabel": "Printed page 21",
  "lines": [
   19,
   22
  ],
  "quote": "(c) Home Renovations or Repairs. If you want to make any repairs or improvements to the Property that could interfere with the System (such as repairing the roof where the System is located), you may not have the System removed yourself but must work with EnFin to have the System removed, stored, and reinstalled at your cost."
 },
 "ENFIN-TAX-01": {
  "id": "ENFIN-TAX-01",
  "section": "Section 5(e) - Taxes",
  "printedPage": 22,
  "pdfPage": 48,
  "pageLabel": "Printed page 22",
  "lines": [
   1,
   8
  ],
  "quote": "(e) Taxes. If any taxes (including, but not limited to, sales and transaction taxes and including any associated interest and penalties) are assessed related to this Lease (other than with respect to federal and state taxes on EnFin’s income from the System), you agree to pay the applicable taxes. You also agree to pay as invoiced any applicable personal property taxes on the System that your local jurisdiction may levy. If any such taxes are paid by EnFin Corp, you agree to pay or reimburse EnFin Corp for all such taxes, except to the extent that you are prohibited from doing so by applicable law. If you exercise your option to purchase the System as described in this Lease, you agree to pay any applicable tax on the purchase price for the System."
 },
 "ENFIN-WARR-01": {
  "id": "ENFIN-WARR-01",
  "section": "Section 7(a)(i) - System Warranty",
  "printedPage": 24,
  "pdfPage": 50,
  "pageLabel": "Printed page 24",
  "lines": [
   15,
   17
  ],
  "quote": "(i) During the entire Term (i.e., both the Initial Term and any Additional Terms), under normal use and service conditions, the System will be free from defects in workmanship or defects in, or a breakdown of, materials or components (the “System Warranty”);"
 },
 "ENFIN-ROOF-01": {
  "id": "ENFIN-ROOF-01",
  "section": "Section 7(a)(ii) - Roof Warranty",
  "printedPage": 24,
  "pdfPage": 50,
  "pageLabel": "Printed page 24",
  "lines": [
   18,
   24
  ],
  "quote": "(ii) We warrant that roof penetrations made by any Contractor that we designate will be weather tight for a period of ten (10) years from the Commercial Operation Date (the “Roof Warranty Period ”). The roof penetrations may void your roof warranty for portions of the roof — please check your roof warranty for specific warranty terms. You should consider the age and remaining life of your roof prior to installing a distributed energy generation system. Replacement of your roof may require reinstallation of the distributed energy generation system."
 },
 "ENFIN-REPAIR-01": {
  "id": "ENFIN-REPAIR-01",
  "section": "Section 7(a)(iii) - Repair Promise",
  "printedPage": 24,
  "pdfPage": 50,
  "pageLabel": "Printed page 24",
  "lines": [
   25,
   34
  ],
  "quote": "(iii) During the entire Agreement Term, EnFin will honor the System Warranty and will repair or replace any defective part, material or component or correct any defective workmanship, at no cost or expense to you (including all labor costs), when you submit a valid claim to us under this Limited Warra nty (“ Repair Promise ”). If any Contractor that we designate damages your Home, your belongings or your Property we will ensure that the damage is repaired or pay you for the damage cause. EnFin may use new or reconditioned parts when making repairs or replacements. EnFin may also, at no additional cost to you, upgrade or add to any part of the System to ensure that it performs according to the guarantees set forth in this Limited Warranty. Cosmetic repairs that do not involve safety or performance shall be made at our discretion."
 },
 "ENFIN-WARR-02": {
  "id": "ENFIN-WARR-02",
  "section": "Section 7(b) - Warranty length",
  "printedPage": 25,
  "pdfPage": 51,
  "pageLabel": "Printed page 25",
  "lines": [
   1,
   11
  ],
  "quote": "(b) Warranty Length (i) The warranties in Sections 7(a)(i) and 7(a)(iii) above will start when the System is installed at your Home and continue through the entire Agreement Term. Thus, for as long as you lease the System from EnFin, you will have a System Warranty and our Repair Promise. (ii) The Roof Warranty Period may be shorter than the System Warranty, as described in Section 7(a)(ii) above. (iii) If you have assumed an existing Lease, then this Limited Warranty will cover you for the remaining balance of the existing Lease Term. (iv) If you purchase the System at any point throughout the Term, all manufacturers’ warranties will remain in place but all existing EnFin warranties, including but not limited to workmanship warranties, will be voided."
 },
 "ENFIN-PERF-01": {
  "id": "ENFIN-PERF-01",
  "section": "Section 7(c)(i) - Performance Guarantee",
  "printedPage": 25,
  "pdfPage": 51,
  "pageLabel": "Printed page 25",
  "lines": [
   13,
   16
  ],
  "quote": "(i) EnFin Corp provides you with a Performance Guarantee on the System during the Initial Term. The Performance Guarantee is dependent on the size and design of your System and any change in System size, design, or this Agreement will nullify all former Performance Guarantees and will result in a new Performance Guarantee being delivered to you."
 },
 "ENFIN-PERF-02": {
  "id": "ENFIN-PERF-02",
  "section": "Section 7(c)(ii) - Operation within manufacturer specifications",
  "printedPage": 25,
  "pdfPage": 51,
  "pageLabel": "Printed page 25",
  "lines": [
   17,
   19
  ],
  "quote": "(ii) EnFin guarantees that during the Agreement Term the System will operate within manufacturer’s specifications and if it does not that EnFin will designate a Contractor to repair or replace any defective part and restore System performance."
 },
 "ENFIN-MON-01": {
  "id": "ENFIN-MON-01",
  "section": "Section 7(c)(iii) - Monitoring Service",
  "printedPage": 25,
  "pdfPage": 51,
  "pageLabel": "Printed page 25",
  "lines": [
   20,
   26
  ],
  "quote": "(iii) During the Agreement Term, we will provide you at no additional cost our Monitoring Service (“Monitoring Software ”). Monitoring Software is a proprietary monitoring system designed and installed by EnFin or its designated Contractor that captures and displays historical power generation data over an Internet connection and consists of hardware located on site and software hosted by EnFin or its designated Contractor. If the System is not operating within normal ranges, Monitoring Software will alert us and we will remedy any material issues."
 },
 "ENFIN-MFR-01": {
  "id": "ENFIN-MFR-01",
  "section": "Section 7(d) - Manufacturer warranties",
  "printedPage": 25,
  "pdfPage": 51,
  "pageLabel": "Printed page 25",
  "lines": [
   27,
   34
  ],
  "quote": "(d) Manufacturer Warranties Any manufacturer’s warranty is in addition to, not in lieu of, the Limited Warranty described in this section. The System’s solar panels carry a minimum manufacturer’s warranty that: (1) during the first ten (10) years of use, the modules’ electrical output will not degrade by more than ten percent (10%) from the originally rated output; and (2) during the first twenty-five (25) years of use, the modules’ electrical output will not degrade by more than twenty percent (20%) from the originally rated output. The inverters that convert the solar energy produced by the panels from variable direct current (DC) into a utility frequency alternating current (AC) carry a minimum ten (10) year equipment warranty."
 },
 "ENFIN-MAINT-01": {
  "id": "ENFIN-MAINT-01",
  "section": "Section 7(e)(i) - Maintenance",
  "printedPage": 26,
  "pdfPage": 52,
  "pageLabel": "Printed page 26",
  "lines": [
   1,
   5
  ],
  "quote": "(e) Maintenance and Operation (i) When the System is installed, EnFin or its designated Contractor will provide you with a link to its System Guide. This Guide provides you with System operation instructions, answers to frequently asked questions, troubleshooting tips and service information. EnFin will designate a Contractor to perform all required System maintenance."
 },
 "ENFIN-MAINT-02": {
  "id": "ENFIN-MAINT-02",
  "section": "Section 7(e)(ii) - Internet connection",
  "printedPage": 26,
  "pdfPage": 52,
  "pageLabel": "Printed page 26",
  "lines": [
   6,
   15
  ],
  "quote": "(ii) The Monitoring Software service requires a high speed Internet line to operate. Therefore, during the Agreement Term, you agree to maintain the communication link between Monitoring Software and the System and between Monitoring Software and the Internet. You agree to maintain and make available, at your cost, a functioning indoor Internet connection with one available wired Ethernet port and standard AC power outlet within eighty (80) feet of the System’s AC/DC inverter(s) or with wireless internet that is sufficient for our needs. This communication link must be a 10/100 Mbps Ethernet connection or its wireless equivalent that supports common Internet protocols (TCP/IP and DHCP). If you do not have and maintain a working high speed Internet line we will not be able to monitor the System."
 },
 "ENFIN-CLAIM-01": {
  "id": "ENFIN-CLAIM-01",
  "section": "Section 7(f) - Making a claim",
  "printedPage": 26,
  "pdfPage": 52,
  "pageLabel": "Printed page 26",
  "lines": [
   16,
   21
  ],
  "quote": "(f) Making a Claim; Transferring this Warranty (i) You can make a claim by: A. emailing us at the email address at the top of this Agreement; or B. writing us a letter and sending it overnight mail with a well-known service; (ii) EnFin will accept and honor any valid and properly submitted Warranty claim made during any Term by any person to whom you properly transfer the Lease."
 },
 "ENFIN-EXCL-01": {
  "id": "ENFIN-EXCL-01",
  "section": "Section 7(g) - Exclusions",
  "printedPage": 26,
  "pdfPage": 52,
  "pageLabel": "Printed page 26",
  "lines": [
   29,
   35
  ],
  "quote": "(g) Exclusions and Disclaimer The limited warranties and guarantees provided in this Limited Warranty do not apply to any lost power production or any repair, replacement or correction required due to the following: (i) someone other than EnFin or its approved service providers installed, removed, re-installed or repaired the System; (ii) normal wear and tear or cosmetic or aesthetic repairs that do not involve safety or performance of the System;"
 },
 "ENFIN-EXCL-02": {
  "id": "ENFIN-EXCL-02",
  "section": "Section 7(g)(iii) - Access and internet exclusion",
  "printedPage": 27,
  "pdfPage": 53,
  "pageLabel": "Printed page 27",
  "lines": [
   1,
   4
  ],
  "quote": "(iii) you or a third party’s misuse, abuse or alteration of the System; your failure to provide us access, at your expense, to a continuous high speed internet connection, during the Limited Warranty. This internet connection will have certain required minimum characteristics as determined by us;"
 },
 "ENFIN-EXCL-03": {
  "id": "ENFIN-EXCL-03",
  "section": "Section 7(g)(v) and (ix) - Homeowner breach and removal for roof repairs",
  "printedPage": 27,
  "pdfPage": 53,
  "pageLabel": "Printed page 27",
  "lines": [
   9,
   10
  ],
  "quote": "(v) your failure to perform, or breach of, your obligations under the Agreement (e.g., you modify or alter the System);"
 },
 "ENFIN-EXCL-04": {
  "id": "ENFIN-EXCL-04",
  "section": "Section 7(g)(ix) - Lost production not caused by a defect",
  "printedPage": 27,
  "pdfPage": 53,
  "pageLabel": "Printed page 27",
  "lines": [
   25,
   27
  ],
  "quote": "(ix) any system failure or lost production not caused by a System defect (e.g., the System is not producing power because it has been removed to make roof repairs or you have required us to locate the inverter in a non-shaded area);"
 },
 "ENFIN-ASSIGN-01": {
  "id": "ENFIN-ASSIGN-01",
  "section": "Section 8 - Assignment of the Limited Warranty",
  "printedPage": 29,
  "pdfPage": 55,
  "pageLabel": "Printed page 29",
  "lines": [
   7,
   13
  ],
  "quote": "EnFin may also assign its rights or obligations under the Limited Warranty to a third party without your consent, provided that any assignment of EnFin’s obligations under the Limited Warranty shall be to a party professionally and financially qualified to perform such obligation. The Limited Warranty protects only the person who hosts the System. Your rights and obligations under the Limited Warranty will be automatically transferred to any person who purchases the System from you or to whom you properly t ransfer the Agreement. The Limited Warranty contains the parties’ entire agreement regarding the limited warranty of the System."
 },
 "ENFIN-OWN-01": {
  "id": "ENFIN-OWN-01",
  "section": "Section 9 - Ownership of the System",
  "printedPage": 29,
  "pdfPage": 55,
  "pageLabel": "Printed page 29",
  "lines": [
   17,
   22
  ],
  "quote": "Section 9. OWNERSHIP OF THE SYSTEM; TAX CREDITS AND REBATES. You agree that the System is EnFin’s personal property under the Uniform Commercial Code. You understand and agree that this Lease is not a contract to sell the System to you or a contract to sell you the energy the System generates. EnFin owns the System for all purposes, including any data generated from the System. You shall at all times keep the System free and clear of all liens, claims, levies and legal processes not created by EnFin, and shall at your expense protect and defend EnFin against the same."
 },
 "ENFIN-PURCH-01": {
  "id": "ENFIN-PURCH-01",
  "section": "Section 10 - Purchase Option notice and payment",
  "printedPage": 29,
  "pdfPage": 55,
  "pageLabel": "Printed page 29",
  "lines": [
   35,
   37
  ],
  "quote": "You have the option to purchase the System at the end of the Term and at the times detailed below (together with (i), (ii), and (iii) collectively, (the “ Purchase Option ”) during the Initial Term. To exercise a Purchase Option you must be in good standing under this Lease and you need to give us written notice of …"
 },
 "ENFIN-PURCH-02": {
  "id": "ENFIN-PURCH-02",
  "section": "Section 10 - Purchase Option times",
  "printedPage": 30,
  "pdfPage": 56,
  "pageLabel": "Printed page 30",
  "lines": [
   1,
   6
  ],
  "quote": "… your intent to purchase within sixty (60) days of the applicable date and deliver payment to EnFin within thirty (30) days of receiving an invoice from us for the purchase price. You can purchase this System: (i) Upon the sale of the home as long as that sale is after the five (5) year anniversary of the Commercial Operation Date; (ii) if EnFin ever ceases its operations and fails to provide for a substitute provider; and (iii) At the end of the Initial Term."
 },
 "ENFIN-PURCH-03": {
  "id": "ENFIN-PURCH-03",
  "section": "Section 10 - Purchase price",
  "printedPage": 30,
  "pdfPage": 56,
  "pageLabel": "Printed page 30",
  "lines": [
   7,
   16
  ],
  "quote": "When you exercise any Purchase Option, the price you will pay for the System will be the lesser of the System’s fair market value at the time of purchase (“FMV”) or value derived from the Purchase Calculation. If purchased at the end of the Initial Term, this Purchase Calculation is the sum of your estimated solar production for the ten-year period following expiration of your Initial Term, multiplied by your average utility rate the year that the Initial Term ends, with this total figure being discounted by 10%. EnFin will determine the FMV of the System by hiring a third-party independent appraiser to estimate the value of a comparable in-service photovoltaic system (with a battery if applicable) in your state and utility service area. This valuation will consider the System’s age, location, size, and other market characteristics such as equipment type, service costs, the value of electricity in your area, and any applicable incentives. EnFin’s maintenance and repair obligations under the Limited Warranty (Section 7) will end when you purchase the System."
 },
 "ENFIN-PREPAY-01": {
  "id": "ENFIN-PREPAY-01",
  "section": "Section 11 - Prepayment",
  "printedPage": 30,
  "pdfPage": 56,
  "pageLabel": "Printed page 30",
  "lines": [
   17,
   25
  ],
  "quote": "Section 11. PREPAYMENT OF THE SYSTEM (a) You have the option to prepay all the expected Monthly Payments you will owe EnFin during the remaining portion of the Initial Term ( “Prepayment”). EnFin Corp's obligations under the Agreement will not change if you make a Prepayment. After you pay the Prepayment, you will make no routine monthly payments during the Initial Term. (b) The Prepayment amount will be based on the following: (i) all accrued but unpaid Monthly Payments, taxes, late charges, penalties, interest and all or any other sums then accrued or due and owing, plus (ii) the number of Monthly Payments remaining in the Initial Term multiplied by the amount of such Monthly Payments."
 },
 "ENFIN-BATT-01": {
  "id": "ENFIN-BATT-01",
  "section": "Section 12(a)-(b) - Batteries included",
  "printedPage": 30,
  "pdfPage": 56,
  "pageLabel": "Printed page 30",
  "lines": [
   27,
   28
  ],
  "quote": "(a) The System may include one or more batteries. Subsections b, c, d, and e of this section only apply in the event that your System includes one or more batteries."
 },
 "ENFIN-BATT-02": {
  "id": "ENFIN-BATT-02",
  "section": "Section 12(b) - Backup and reserve",
  "printedPage": 30,
  "pdfPage": 56,
  "pageLabel": "Printed page 30",
  "lines": [
   33,
   35
  ],
  "quote": "(b) For each battery, the System may also contain a storage-enabled inverter/charger capable of providing power dependent upon the state of battery charge. Your battery may provide a backup …"
 },
 "ENFIN-BATT-03": {
  "id": "ENFIN-BATT-03",
  "section": "Section 12(b) - Reserve setting",
  "printedPage": 31,
  "pdfPage": 57,
  "pageLabel": "Printed page 31",
  "lines": [
   1,
   3
  ],
  "quote": "… energy reserve. Each battery may draw its charge from the photovoltaic system and will provide backup power within the limitations of the System, as determined by EnFin. You will be responsible for determining the minimum charge to leave on reserve for your battery in case of an outage."
 },
 "ENFIN-BATT-04": {
  "id": "ENFIN-BATT-04",
  "section": "Section 12(c) - Backup circuits and loads",
  "printedPage": 31,
  "pdfPage": 57,
  "pageLabel": "Printed page 31",
  "lines": [
   4,
   8
  ],
  "quote": "(c) As not all electrical loads are suitable for backup operation, upon site review, we may determine some circuits may be excluded or moved to a separate sub-panel. You are responsible for failure or damage caused by backing up more loads than EnFin approved and/or changing settings from initial installation conditions. We are not responsible for System failure caused due to excessive loads."
 },
 "ENFIN-BATT-05": {
  "id": "ENFIN-BATT-05",
  "section": "Section 12(d) - EnFin operation of the battery",
  "printedPage": 31,
  "pdfPage": 57,
  "pageLabel": "Printed page 31",
  "lines": [
   9,
   14
  ],
  "quote": "(d) EnFin or its designees may, from time to time, administer and operate the System (including its battery) to optimize your Home’s energy production and consumption, as well as for demand response or other utility-based programs designed to reduce your electricity costs or to maintain the reliability of your local electric grid (if available in your utility area). EnFin may use the energy stored in the battery(ies) to reduce strain on the electrical grid at times of high energy demand in your region, or for similar purpose."
 },
 "ENFIN-BATT-06": {
  "id": "ENFIN-BATT-06",
  "section": "Section 12(e) - No guarantee of uninterrupted backup",
  "printedPage": 31,
  "pdfPage": 57,
  "pageLabel": "Printed page 31",
  "lines": [
   15,
   22
  ],
  "quote": "(e) DEPENDING ON THE BATTERY TYPE AND CONFIGURATION, ANY BATTERIES ASSOCIATED WITH THIS SYSTEM MAY BE ABLE TO PROVIDE BACKUP POWER DURING A POWER OUTAGE. HOWEVER, EnFin DOES NOT GUARANTEE OR WARRANT THAT BATTERY BACKUP CAPACITY WILL BE AVAILABLE WITHOUT INTERRUPTION DURING EVERY POWER OUTAGE. YOU AGREE THAT EnFin WILL NOT BE LIABLE IF THE BATTERY FAILS TO PROVIDE BACKUP POWER, AND EnFin DISCLAIMS ANY SUCH LIABILITY, REGARDLESS OF THE REASON FOR THE FAILURE. DO NOT DEPEND ON BATTERY BACKUP POWER TO POWER LIFE SUPPORT OR OTHER MEDICAL EQUIPMENT. IF YOU HAVE CRITICAL MEDICAL EQUIPMENT POWER NEEDS DURING A POWER OUTAGE, CONTACT YOUR LOCAL EMERGENCY SERVICES OR DIAL 911."
 },
 "ENFIN-BATT-07": {
  "id": "ENFIN-BATT-07",
  "section": "Section 12(f) - Notify EnFin if backup fails",
  "printedPage": 31,
  "pdfPage": 57,
  "pageLabel": "Printed page 31",
  "lines": [
   23,
   24
  ],
  "quote": "(f) Please notify EnFin at the contact information at the top of this Agreement in the event your battery does not provide backup power during a power outage."
 },
 "ENFIN-XFER-01": {
  "id": "ENFIN-XFER-01",
  "section": "Section 13(a)(i) - Transfer the Agreement to the buyer",
  "printedPage": 31,
  "pdfPage": 57,
  "pageLabel": "Printed page 31",
  "lines": [
   29,
   36
  ],
  "quote": "(a) If you sell your Home you can: (i) Transfer this Agreement. If the person buying your Home meets EnFin’s requirements, then where permitted by the local utility, the person buying your Home can sign a transfer agreement assuming all of your rights and obligations under this Lease (including your rights under the Limited Warranty). The System stays at your Home and the person buying your home will assume your rights and obligations under this Lease. You agree to give EnFin at least thirty (30) days but not more than three (3) months prior written notice if you want someone to assume your Lease obligations."
 },
 "ENFIN-XFER-02": {
  "id": "ENFIN-XFER-02",
  "section": "Section 13(a)(ii)-(b) - Purchase, prepay, or default",
  "printedPage": 32,
  "pdfPage": 58,
  "pageLabel": "Printed page 32",
  "lines": [
   1,
   4
  ],
  "quote": "(ii) Purchase the System (see Section 10). (iii) Prepay the System (see Section 11). (b) If you sell your Home and cannot comply with any of the options in subsection (a) above, you will be in default as defined in Section 16 under this Agreement."
 },
 "ENFIN-XFER-03": {
  "id": "ENFIN-XFER-03",
  "section": "Section 13(c) - Foreclosure",
  "printedPage": 32,
  "pdfPage": 58,
  "pageLabel": "Printed page 32",
  "lines": [
   5,
   13
  ],
  "quote": "(c) This agreement is free of any restrictions that prohibit the homeowner from freely transferring their Home. In the event of a foreclosure on your Home, your lender has the right (but not the obligation) to do ONE of the following: (i) terminate this Lease and require EnFin to remove the System subject to your obligations under Sections 16 and 17; (ii) become a beneficiary (but not obligor) of this Lease free of charge (i.e., receive power from the System and enforce the Limited Warranty; (iii) enter into a new Lease with us on terms no less favorable than the current Agreement; or (iv) request transfer of the Lease under this Section 13 to a subsequent purchaser of your Home."
 },
 "ENFIN-XFER-04": {
  "id": "ENFIN-XFER-04",
  "section": "Section 13(d) - Death and estate or heirs",
  "printedPage": 32,
  "pdfPage": 58,
  "pageLabel": "Printed page 32",
  "lines": [
   14,
   15
  ],
  "quote": "(d) Upon your death, this Agreement can be transferred as described under Section 13(a) to your estate or heirs."
 },
 "ENFIN-REFI-01": {
  "id": "ENFIN-REFI-01",
  "section": "Section 13 - Sale, conveyance, refinancing and Fixture Filing",
  "printedPage": 32,
  "pdfPage": 58,
  "pageLabel": "Printed page 32",
  "lines": [
   16,
   22
  ],
  "quote": "EnFin will not prohibit the sale, conveyance or refinancing of the Property. We may choose to file in the real estate records a UCC -1 financing statement ( “Fixture Filing ”) that preserves our rights in the System. The Fixture Filing is intended only to give notice of its rights relating to the System and is not a lien or encumbrance against the Property. We will explain the Fixture Filing to any subsequent purchasers of the Property and any related lenders as requested. We will also accommodate reasonable requests from lenders or title companies to facilitate a purchase, financing or refinancing of the Property and charge you a reasonable UCC Notice Removal and Refiling Fee."
 },
 "ENFIN-LOSS-01": {
  "id": "ENFIN-LOSS-01",
  "section": "Section 14(a) - Risk of loss",
  "printedPage": 32,
  "pdfPage": 58,
  "pageLabel": "Printed page 32",
  "lines": [
   24,
   27
  ],
  "quote": "(a) Unless you are grossly negligent or you intentionally damage the System, EnFin will bear all of the risk of loss, damage, theft, destruction or similar occurrence to any or all of the System. Except as expressly provided in this Lease, no loss, damage, theft or destruction will excuse you from your obligations under this Lease."
 },
 "ENFIN-REMOVE-01": {
  "id": "ENFIN-REMOVE-01",
  "section": "Section 18 - Removal at the end of the term",
  "printedPage": 34,
  "pdfPage": 60,
  "pageLabel": "Printed page 34",
  "lines": [
   18,
   30
  ],
  "quote": "Section 18. SYSTEM REMOVAL; RETURN AT END OF TERM EnFin is responsible, in accordance with applicable laws and regulations, for safely clearing, cleaning, and removing the System from the Property. At the end of the Initial Term (if this Lease will not be renewed pursuant to Section 2), if you have not exercised your purchase option and you have not defaulted, then within ninety (90) days you agree to contact EnFin at the contact information listed at the top of this Agreement to schedule a convenient time for EnFin to remove the System from your Home at no cost to you. EnFin will remove the System without damaging your property, including removing the posts, waterproofing the post area and return the roof as close as is reasonably possible to its original condition on an architecturally consistent basis before the System was installed ( e.g., ordinary wear and tear and color variances due to manufacturing changes are excepted). EnFin will warrant the waterproofing for five (5) days after it removes the System. You agree to reasonably cooperate with EnFin in removing the System including providing necessary space, access and storage, and we will reasonably cooperate with you to schedule removal in a time and manner that minimizes inconvenience to you."
 },
 "ENFIN-EXB-01": {
  "id": "ENFIN-EXB-01",
  "section": "Exhibit B - Performance Guarantee",
  "printedPage": null,
  "pdfPage": 75,
  "pageLabel": "Exhibit B (PDF page 75, footer Ex. C - 1)",
  "lines": [
   14,
   22
  ],
  "quote": "This Exhibit B sets forth the terms and conditions of a performance guarantee (the “Performance Guarantee”) that is part of the Limited Warranty provided by EnFin Corp in connection with the Agreement. This Performance Guarantee is effective through the Initial Term of the Agreement. 1. Warranty. EnFin Corp guarantees that during the Initial Term of the Agreement the System will generate at least 90% of the expected annual production during the first year and that for each subsequent year, the performance will not decline by more than 0.55 percent per year. Applying this expected annual degradation factor (the “ Methodology”), the calculation of the guaranteed kilowatt-hours (kWh) (“Guaranteed kWh”) of energy is set forth [below]:"
 },
 "ENFIN-EXB-02": {
  "id": "ENFIN-EXB-02",
  "section": "Exhibit B(b) - True-Up Term and refunds",
  "printedPage": null,
  "pdfPage": 76,
  "pageLabel": "Exhibit B (PDF page 76, footer Ex. C - 2)",
  "lines": [
   23,
   32
  ],
  "quote": "… b) True-Up Term and Refunds : if at the end of each twelve (12) month anniversary (except for the first such anniversary, which is explained below) of the Commercial Operation Date (each, a “True-up Term”) the Actual kWh (defined below) generated by the System is less than the Guaranteed kWh identified in the table above, then EnFin Corp will issue you refund. EnFin Corp will calculate this refund by subtracting the Actual Output for that True-Up Term from the Guaranteed Output for that True-Up Term (as identified in the table above), and multiplying the result by the Refund Rate per kWh (as identified in the table above). The amount resulting from this calculation is called the “Refund Amount.” [For the first two years of the Initial Term (year 1 and 2), the True-Up Term will be 24 months. EnFin Corp will pay you the Refund Amount within ninety (90) days after the end of the applicable True-Up Term."
 },
 "ENFIN-EXB-03": {
  "id": "ENFIN-EXB-03",
  "section": "Exhibit B(b) - How production is measured",
  "printedPage": null,
  "pdfPage": 76,
  "pageLabel": "Exhibit B (PDF page 76, footer Ex. C - 2)",
  "lines": [
   34,
   37
  ],
  "quote": "“Actual kWh” means the electricity produced by the System in kWh as measured and recorded by EnFin Corp during each True-Up Term plus any kWh for which you previously received a refund. EnFin Corp will measure the Actual kWh [using a monitoring device] or, if a monitoring device is unavailable, estimate the Actual kWh by reasonable means."
 },
 "ENFIN-EXB-04": {
  "id": "ENFIN-EXB-04",
  "section": "Exhibit B(c) - Overproduction",
  "printedPage": null,
  "pdfPage": 76,
  "pageLabel": "Exhibit B (PDF page 76, footer Ex. C - 2)",
  "lines": [
   38,
   41
  ],
  "quote": "… c) Overproduction. If at the end of a True-up Term the Actual kWh is greater than the Guaranteed kWh during any True-Up Term, the extra kWh produced will be yours at no additional cost/this surplus will be carried over and will be used to offset any deficits that may occur in a subsequent True-Up Term."
 }
});
if(typeof module!=='undefined'&&module.exports)module.exports=D;else window.SWPEnfinCitations=D;
})();
