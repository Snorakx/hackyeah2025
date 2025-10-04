import * as XLSX from "xlsx";

export class ReportGenerator {
  static generatePensionReport(simulationData, calculatedPension) {
    const reportData = {
      title: "Raport Symulacji Emerytury ZUS",
      generatedAt: new Date().toLocaleString("pl-PL"),
      userData: {
        wiek: simulationData.age,
        plec: simulationData.gender === "male" ? "Mężczyzna" : "Kobieta",
        wynagrodzenieBrutto: simulationData.grossSalary,
        rokRozpoczeciaPracy: simulationData.workStartYear,
        rokZakonczeniaPracy: simulationData.retirementYear,
        kontoZUS: simulationData.zusAccount || "Nie podano",
        subkontoZUS: simulationData.zusSubAccount || "Nie podano",
        uwzglednijZwolnienia: simulationData.includeSickLeave ? "Tak" : "Nie",
      },
      results: {
        emeryturaRzeczywista: calculatedPension.real,
        emeryturaUrealniona: calculatedPension.adjusted,
        sredniaEmerytura: calculatedPension.averagePension,
        roznica: calculatedPension.difference,
        procentRoznicy: calculatedPension.percentageDifference,
        stopaZastapienia: calculatedPension.replacementRate,
        wynagrodzenieFinalne: calculatedPension.finalSalary,
        wynagrodzenieBezZwolnien: calculatedPension.salaryWithoutSickLeave,
        wynagrodzenieZZwolnieniami: calculatedPension.salaryWithSickLeave,
        wplywZwolnien: calculatedPension.sickLeaveImpact,
      },
      additionalYears: calculatedPension.additionalYears || [],
      recommendations: this.generateRecommendations(calculatedPension),
    };

    return reportData;
  }

  static generateRecommendations(calculatedPension) {
    const recommendations = [];

    if (calculatedPension.replacementRate < 60) {
      recommendations.push({
        type: "warning",
        title: "Niska stopa zastąpienia",
        description:
          "Twoja emerytura będzie stanowić mniej niż 60% ostatniego wynagrodzenia. Rozważ dłuższą pracę lub dodatkowe oszczędności.",
      });
    }

    if (calculatedPension.adjusted < calculatedPension.averagePension) {
      recommendations.push({
        type: "info",
        title: "Emerytura poniżej średniej",
        description:
          "Twoja prognozowana emerytura jest niższa od średniej krajowej. Rozważ zwiększenie składek lub wydłużenie okresu pracy.",
      });
    }

    if (calculatedPension.sickLeaveImpact > 0) {
      recommendations.push({
        type: "tip",
        title: "Wpływ zwolnień lekarskich",
        description: `Zwolnienia lekarskie obniżają Twoją emeryturę o ${Math.round(
          calculatedPension.sickLeaveImpact
        )} zł miesięcznie.`,
      });
    }

    if (calculatedPension.replacementRate >= 70) {
      recommendations.push({
        type: "success",
        title: "Dobra stopa zastąpienia",
        description:
          "Twoja stopa zastąpienia jest na dobrym poziomie. Kontynuuj obecną strategię oszczędzania.",
      });
    }

    return recommendations;
  }

  static exportToPDF(reportData) {
    // This would require a PDF generation library like jsPDF
    // For now, we'll create a simple HTML report that can be printed
    const htmlContent = this.generateHTMLReport(reportData);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  }

  static generateHTMLReport(reportData) {
    return `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportData.title}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #3f84d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #3f84d2;
            margin: 0;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #00416e;
            border-bottom: 2px solid #00416e;
            padding-bottom: 10px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          .data-table th,
          .data-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .data-table th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .recommendation {
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid;
          }
          .recommendation.warning {
            background-color: #fff3cd;
            border-left-color: #ffc107;
          }
          .recommendation.info {
            background-color: #d1ecf1;
            border-left-color: #17a2b8;
          }
          .recommendation.tip {
            background-color: #d4edda;
            border-left-color: #28a745;
          }
          .recommendation.success {
            background-color: #d1ecf1;
            border-left-color: #17a2b8;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 0.9em;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${reportData.title}</h1>
          <p>Wygenerowano: ${reportData.generatedAt}</p>
        </div>

        <div class="section">
          <h2>Dane użytkownika</h2>
          <table class="data-table">
            <tr><th>Wiek</th><td>${reportData.userData.wiek} lat</td></tr>
            <tr><th>Płeć</th><td>${reportData.userData.plec}</td></tr>
            <tr><th>Wynagrodzenie brutto</th><td>${reportData.userData.wynagrodzenieBrutto.toLocaleString(
              "pl-PL"
            )} zł</td></tr>
            <tr><th>Rok rozpoczęcia pracy</th><td>${
              reportData.userData.rokRozpoczeciaPracy
            }</td></tr>
            <tr><th>Rok zakończenia pracy</th><td>${
              reportData.userData.rokZakonczeniaPracy
            }</td></tr>
            <tr><th>Konto ZUS</th><td>${
              reportData.userData.kontoZUS
            } zł</td></tr>
            <tr><th>Subkonto ZUS</th><td>${
              reportData.userData.subkontoZUS
            } zł</td></tr>
            <tr><th>Uwzględnij zwolnienia</th><td>${
              reportData.userData.uwzglednijZwolnienia
            }</td></tr>
          </table>
        </div>

        <div class="section">
          <h2>Wyniki symulacji</h2>
          <table class="data-table">
            <tr><th>Emerytura rzeczywista</th><td>${reportData.results.emeryturaRzeczywista.toLocaleString(
              "pl-PL"
            )} zł</td></tr>
            <tr><th>Emerytura urealniona</th><td>${reportData.results.emeryturaUrealniona.toLocaleString(
              "pl-PL"
            )} zł</td></tr>
            <tr><th>Średnia emerytura w roku przejścia</th><td>${reportData.results.sredniaEmerytura.toLocaleString(
              "pl-PL"
            )} zł</td></tr>
            <tr><th>Różnica od średniej</th><td>${reportData.results.roznica.toLocaleString(
              "pl-PL"
            )} zł (${reportData.results.procentRoznicy.toFixed(1)}%)</td></tr>
            <tr><th>Stopa zastąpienia</th><td>${
              reportData.results.stopaZastapienia
            }%</td></tr>
            <tr><th>Wynagrodzenie finalne</th><td>${reportData.results.wynagrodzenieFinalne.toLocaleString(
              "pl-PL"
            )} zł</td></tr>
          </table>
        </div>

        <div class="section">
          <h2>Rekomendacje</h2>
          ${reportData.recommendations
            .map(
              (rec) => `
            <div class="recommendation ${rec.type}">
              <strong>${rec.title}</strong><br>
              ${rec.description}
            </div>
          `
            )
            .join("")}
        </div>

        <div class="footer">
          <p>Raport wygenerowany przez Symulator Emerytalny ZUS</p>
          <p>Zakład Ubezpieczeń Społecznych - Narzędzie edukacyjne</p>
        </div>
      </body>
      </html>
    `;
  }

  static exportToExcel(reportData) {
    const workbook = XLSX.utils.book_new();

    // User data sheet
    const userDataSheet = XLSX.utils.json_to_sheet([reportData.userData]);
    XLSX.utils.book_append_sheet(workbook, userDataSheet, "Dane użytkownika");

    // Results sheet
    const resultsSheet = XLSX.utils.json_to_sheet([reportData.results]);
    XLSX.utils.book_append_sheet(workbook, resultsSheet, "Wyniki");

    // Recommendations sheet
    const recommendationsSheet = XLSX.utils.json_to_sheet(
      reportData.recommendations
    );
    XLSX.utils.book_append_sheet(
      workbook,
      recommendationsSheet,
      "Rekomendacje"
    );

    const fileName = `raport-emerytury-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}
