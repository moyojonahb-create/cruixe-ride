# Tiny runtime image only; binary is compiled in a separately resource-capped builder.
ARG RUNTIME_BASE
FROM ${RUNTIME_BASE}
ARG RUN_ID
LABEL cruize.purpose="p03-disposable" cruize.run="${RUN_ID}"
COPY bin/assignmenttest /opt/assignmenttest
COPY runner.sh /opt/runner.sh
USER 65534:65534
ENTRYPOINT ["/bin/sh", "/opt/runner.sh"]
